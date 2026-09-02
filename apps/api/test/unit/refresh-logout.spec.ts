import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as argon2 from 'argon2';
import { AuthService } from '../../src/auth/auth.service';
import { LoginRateLimiterService } from '../../src/auth/services/login-rate-limiter.service';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('AuthService - refreshTokens() & logout()', () => {
  let authService: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockJwtService = {
    verifyAsync: jest.fn(),
    signAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const config: Record<string, any> = {
        'jwt.accessSecret': 'access_secret_32_chars_long_random_123',
        'jwt.accessExpiry': '15m',
        'jwt.refreshSecret': 'refresh_secret_32_chars_long_random_456',
        'jwt.refreshExpiry': '7d',
      };
      return config[key] !== undefined ? config[key] : defaultValue;
    }),
  };

  let validRefreshToken: string;
  let hashedRefreshToken: string;

  beforeAll(async () => {
    validRefreshToken = 'valid_raw_refresh_token_jwt';
    hashedRefreshToken = await argon2.hash(validRefreshToken);
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        LoginRateLimiterService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);

    jest.clearAllMocks();
  });

  const mockUser = {
    id: 'user-uuid-123',
    name: 'Alexander Montgomery James',
    email: 'user@storerating.local',
    address: '123 Meadowbrook Lane, Chicago, IL',
    role: 'normal',
    refresh_token_hash: '',
    created_at: new Date('2026-09-02T10:00:00Z'),
    updated_at: new Date('2026-09-02T10:00:00Z'),
  };

  describe('refreshTokens()', () => {
    it('should successfully rotate tokens with a valid non-revoked refresh token', async () => {
      mockUser.refresh_token_hash = hashedRefreshToken;

      mockJwtService.verifyAsync.mockResolvedValue({ sub: 'user-uuid-123' });
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue(mockUser);
      mockJwtService.signAsync
        .mockResolvedValueOnce('new_access_token_jwt')
        .mockResolvedValueOnce('new_rotated_refresh_token_jwt');

      const result = await authService.refreshTokens({ refreshToken: validRefreshToken });

      // 1. Verify verifyAsync was called with refresh secret
      expect(jwtService.verifyAsync).toHaveBeenCalledWith(validRefreshToken, {
        secret: 'refresh_secret_32_chars_long_random_456',
      });

      // 2. Verify returned response shape
      expect(result).toEqual({
        accessToken: 'new_access_token_jwt',
        refreshToken: 'new_rotated_refresh_token_jwt',
        user: {
          id: 'user-uuid-123',
          name: 'Alexander Montgomery James',
          email: 'user@storerating.local',
          address: '123 Meadowbrook Lane, Chicago, IL',
          role: 'normal',
          createdAt: mockUser.created_at,
          updatedAt: mockUser.updated_at,
        },
      });

      // 3. Verify that the new rotated refresh token was hashed and stored in the database
      expect(mockPrismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-uuid-123' },
          data: expect.objectContaining({
            refresh_token_hash: expect.stringMatching(/^\$argon2/),
          }),
        }),
      );
    });

    it('should throw 401 Unauthorized if refresh token signature is invalid or expired', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(new Error('jwt expired'));

      await expect(
        authService.refreshTokens({ refreshToken: 'expired_or_invalid_jwt' }),
      ).rejects.toThrow(new UnauthorizedException('Invalid or expired refresh token'));

      expect(mockPrismaService.user.findUnique).not.toHaveBeenCalled();
    });

    it('should throw 401 Unauthorized if session was revoked (refresh_token_hash is null)', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({ sub: 'user-uuid-123' });
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        refresh_token_hash: null, // Revoked session
      });

      await expect(
        authService.refreshTokens({ refreshToken: validRefreshToken }),
      ).rejects.toThrow(new UnauthorizedException('Session has been revoked or expired'));
    });

    it('should throw 401 Unauthorized if refresh token does not match stored hash (already rotated)', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({ sub: 'user-uuid-123' });
      // Stored hash belongs to a different/newer token
      const newerTokenHash = await argon2.hash('newer_rotated_token');
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        refresh_token_hash: newerTokenHash,
      });

      await expect(
        authService.refreshTokens({ refreshToken: validRefreshToken }),
      ).rejects.toThrow(new UnauthorizedException('Invalid or already rotated refresh token'));
    });
  });

  describe('logout() & revokeAllUserSessions()', () => {
    it('should set refresh_token_hash to null on logout', async () => {
      mockPrismaService.user.update.mockResolvedValue({ ...mockUser, refresh_token_hash: null });

      const res = await authService.logout('user-uuid-123');
      expect(res).toEqual({ message: 'Successfully logged out' });

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-uuid-123' },
        data: { refresh_token_hash: null },
      });
    });

    it('should revoke all user sessions when revokeAllUserSessions() is called (e.g. on password change)', async () => {
      mockPrismaService.user.update.mockResolvedValue({ ...mockUser, refresh_token_hash: null });

      await authService.revokeAllUserSessions('user-uuid-123');

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-uuid-123' },
        data: { refresh_token_hash: null },
      });
    });
  });
});
