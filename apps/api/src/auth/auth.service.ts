import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role as SharedRole } from '@ratehub/shared';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { SignupDto } from './dto/signup.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { LoginRateLimiterService } from './services/login-rate-limiter.service';

// Precomputed valid Argon2 hash used exclusively for timing attack equalization when an email is not found
const DUMMY_ARGON2_HASH =
  '$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHQxMjM0NTY3OA$9l15e2197Z0gWc3D2j8t1G4a3V7x0k9L';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly loginRateLimiter: LoginRateLimiterService,
  ) {}

  /**
   * Registers a new Normal User.
   * Enforces argon2 password hashing, hardcoded 'normal' role, and duplicate email checking.
   */
  async signup(dto: SignupDto): Promise<UserResponseDto> {
    const normalizedEmail = dto.email.toLowerCase().trim();

    // 1. Check for existing user with identical email
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException('An account with this email already exists');
    }

    // 2. Hash password with argon2
    const password_hash = await argon2.hash(dto.password);

    // 3. Persist user with hardcoded 'normal' role (immune to payload tampering)
    const user = await this.prisma.user.create({
      data: {
        name: dto.name.trim(),
        email: normalizedEmail,
        password_hash,
        address: dto.address.trim(),
        role: 'normal',
      },
      select: {
        id: true,
        name: true,
        email: true,
        address: true,
        role: true,
        created_at: true,
        updated_at: true,
      },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      address: user.address,
      role: user.role as SharedRole,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };
  }

  /**
   * Authenticates a user with email + password.
   * Features:
   * - Per-account sliding window rate limiting (5 failed attempts triggers lockout).
   * - Constant-time dummy hash verification preventing timing side-channel email probing.
   * - Generates access token (15m, sub+role) and refresh token (7d).
   * - Persists hashed refresh token into DB for revocation support.
   */
  async login(dto: LoginDto): Promise<LoginResponseDto> {
    const normalizedEmail = dto.email.toLowerCase().trim();

    // 1. Enforce per-account rate limiting / lockout check
    this.loginRateLimiter.checkLockout(normalizedEmail);

    // 2. Lookup user by email
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // 3. Handle non-existent user: execute dummy hash verify to prevent timing side-channel
    if (!user) {
      try {
        await argon2.verify(DUMMY_ARGON2_HASH, dto.password);
      } catch {
        // ignore dummy verify error
      }
      this.loginRateLimiter.recordFailedAttempt(normalizedEmail);
      throw new UnauthorizedException('Invalid email or password');
    }

    // 4. Verify password against real hash
    const isPasswordValid = await argon2.verify(user.password_hash, dto.password);
    if (!isPasswordValid) {
      this.loginRateLimiter.recordFailedAttempt(normalizedEmail);
      throw new UnauthorizedException('Invalid email or password');
    }

    // 5. Successful login: reset failed attempt counter
    this.loginRateLimiter.resetFailedAttempts(normalizedEmail);

    // 6. Generate access & refresh tokens
    const accessSecret = this.configService.get<string>('jwt.accessSecret');
    const accessExpiry = this.configService.get<string>('jwt.accessExpiry', '15m');
    const refreshSecret = this.configService.get<string>('jwt.refreshSecret');
    const refreshExpiry = this.configService.get<string>('jwt.refreshExpiry', '7d');

    const accessTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const refreshTokenPayload = {
      sub: user.id,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessTokenPayload, {
        secret: accessSecret,
        expiresIn: accessExpiry,
      }),
      this.jwtService.signAsync(refreshTokenPayload, {
        secret: refreshSecret,
        expiresIn: refreshExpiry,
      }),
    ]);

    // 7. Store hashed refresh token in database (never plaintext)
    const refreshTokenHash = await argon2.hash(refreshToken);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refresh_token_hash: refreshTokenHash },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        address: user.address,
        role: user.role as SharedRole,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
    };
  }

  /**
   * Exchanges a valid refresh token for a new access token and rotated refresh token.
   */
  async refreshTokens(dto: RefreshTokenDto): Promise<LoginResponseDto> {
    const refreshSecret = this.configService.get<string>('jwt.refreshSecret');

    // 1. Verify token signature and expiration
    let payload: { sub: string };
    try {
      payload = await this.jwtService.verifyAsync(dto.refreshToken, {
        secret: refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // 2. Fetch user and verify refresh_token_hash is present (not revoked)
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.refresh_token_hash) {
      throw new UnauthorizedException('Session has been revoked or expired');
    }

    // 3. Verify presented refresh token against stored hash
    const isTokenMatch = await argon2.verify(user.refresh_token_hash, dto.refreshToken);
    if (!isTokenMatch) {
      throw new UnauthorizedException('Invalid or already rotated refresh token');
    }

    // 4. Token Rotation: generate brand new access & refresh tokens
    const accessSecret = this.configService.get<string>('jwt.accessSecret');
    const accessExpiry = this.configService.get<string>('jwt.accessExpiry', '15m');
    const refreshExpiry = this.configService.get<string>('jwt.refreshExpiry', '7d');

    const accessTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const newRefreshTokenPayload = {
      sub: user.id,
    };

    const [accessToken, newRefreshToken] = await Promise.all([
      this.jwtService.signAsync(accessTokenPayload, {
        secret: accessSecret,
        expiresIn: accessExpiry,
      }),
      this.jwtService.signAsync(newRefreshTokenPayload, {
        secret: refreshSecret,
        expiresIn: refreshExpiry,
      }),
    ]);

    // 5. Store new hashed refresh token in database (invalidating previous refresh token)
    const newRefreshTokenHash = await argon2.hash(newRefreshToken);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refresh_token_hash: newRefreshTokenHash },
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        address: user.address,
        role: user.role as SharedRole,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
    };
  }

  /**
   * Logs out the user by clearing their stored refresh token hash server-side.
   */
  async logout(userId: string): Promise<{ message: string }> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refresh_token_hash: null },
    });

    return { message: 'Successfully logged out' };
  }

  /**
   * Revokes all active sessions for a user (called upon password change).
   */
  async revokeAllUserSessions(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refresh_token_hash: null },
    });
  }

  /**
   * Re-verifies current password, updates to new argon2 password hash,
   * and revokes all active refresh tokens for the user across all devices.
   */
  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User no longer exists or session is invalid');
    }

    // 1. Re-verify current password
    const isCurrentValid = await argon2.verify(user.password_hash, dto.currentPassword);
    if (!isCurrentValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // 2. Hash new password with argon2
    const newPasswordHash = await argon2.hash(dto.newPassword);

    // 3. Atomically update password hash and revoke all sessions (refresh_token_hash = null)
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password_hash: newPasswordHash,
        refresh_token_hash: null, // Revokes all existing refresh tokens
      },
    });

    return {
      message: 'Password successfully changed. Please log in again with your new password.',
    };
  }
}
