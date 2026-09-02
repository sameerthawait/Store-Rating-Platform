import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as argon2 from 'argon2';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AuthService } from '../../src/auth/auth.service';
import { ChangePasswordDto } from '../../src/auth/dto/change-password.dto';
import { LoginRateLimiterService } from '../../src/auth/services/login-rate-limiter.service';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('AuthService - changePassword() & DTO Validation', () => {
  let authService: AuthService;
  let prisma: PrismaService;

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

  let currentPasswordHash: string;

  beforeAll(async () => {
    currentPasswordHash = await argon2.hash('OldSecretPass1!');
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
    jest.clearAllMocks();
  });

  const mockUser = {
    id: 'user-uuid-123',
    name: 'Alexander Montgomery James',
    email: 'user@storerating.local',
    address: '123 Meadowbrook Lane, Chicago, IL',
    role: 'normal',
    password_hash: '',
    refresh_token_hash: 'existing_hashed_refresh_token',
    created_at: new Date('2026-09-02T10:00:00Z'),
    updated_at: new Date('2026-09-02T10:00:00Z'),
  };

  describe('ChangePasswordDto Validation Boundaries', () => {
    const createDto = (data: Partial<ChangePasswordDto>) => {
      return plainToInstance(ChangePasswordDto, {
        currentPassword: 'OldSecretPass1!',
        newPassword: 'NewSecretPass1!',
        ...data,
      });
    };

    it('should PASS when new password satisfies all rules (8-16 chars, 1 uppercase, 1 special)', async () => {
      const dto = createDto({ newPassword: 'NewSecretPass1!' });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should FAIL when new password is too short (< 8 chars)', async () => {
      const dto = createDto({ newPassword: 'Pass1!' }); // 6 chars
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'newPassword')).toBe(true);
    });

    it('should FAIL when new password is too long (> 16 chars)', async () => {
      const dto = createDto({ newPassword: 'SuperLongPassword12345!' }); // 23 chars
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'newPassword')).toBe(true);
    });

    it('should FAIL when new password misses uppercase letter', async () => {
      const dto = createDto({ newPassword: 'newpassword123!' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'newPassword')).toBe(true);
    });

    it('should FAIL when new password misses special character', async () => {
      const dto = createDto({ newPassword: 'NewPassword1234' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'newPassword')).toBe(true);
    });
  });

  describe('AuthService.changePassword() Execution', () => {
    it('should successfully update password hash and revoke all existing sessions', async () => {
      mockUser.password_hash = currentPasswordHash;
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        refresh_token_hash: null,
      });

      const dto: ChangePasswordDto = {
        currentPassword: 'OldSecretPass1!',
        newPassword: 'BrandNewPass123!',
      };

      const result = await authService.changePassword('user-uuid-123', dto);

      expect(result.message).toContain('Password successfully changed');

      // Verify user.update was called with new argon2 hash and refresh_token_hash = null
      expect(mockPrismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-uuid-123' },
          data: expect.objectContaining({
            password_hash: expect.stringMatching(/^\$argon2/),
            refresh_token_hash: null, // Critical: revokes all sessions
          }),
        }),
      );

      // Verify the new stored hash corresponds to the new password
      const updateCallArgs = mockPrismaService.user.update.mock.calls[0][0];
      const isNewPasswordValid = await argon2.verify(
        updateCallArgs.data.password_hash,
        'BrandNewPass123!',
      );
      expect(isNewPasswordValid).toBe(true);
    });

    it('should reject with 401 Unauthorized if current password does not match', async () => {
      mockUser.password_hash = currentPasswordHash;
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const dto: ChangePasswordDto = {
        currentPassword: 'WrongOldPassword123!',
        newPassword: 'BrandNewPass123!',
      };

      await expect(authService.changePassword('user-uuid-123', dto)).rejects.toThrow(
        new UnauthorizedException('Current password is incorrect'),
      );

      // Verify database was NOT updated
      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
    });

    it('should cause subsequent refresh attempts to fail after password change has revoked refresh_token_hash', async () => {
      // 1. Password change revokes session: user in DB now has refresh_token_hash: null
      const userAfterPasswordChange = {
        ...mockUser,
        refresh_token_hash: null,
      };

      mockJwtService.verifyAsync.mockResolvedValue({ sub: 'user-uuid-123' });
      mockPrismaService.user.findUnique.mockResolvedValue(userAfterPasswordChange);

      // 2. An old session attempts to refresh with previous refresh token
      await expect(
        authService.refreshTokens({ refreshToken: 'any_old_refresh_token' }),
      ).rejects.toThrow(new UnauthorizedException('Session has been revoked or expired'));
    });
  });
});
