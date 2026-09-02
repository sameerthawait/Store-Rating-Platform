import { HttpException, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as argon2 from 'argon2';
import { AuthService } from '../../src/auth/auth.service';
import { LoginDto } from '../../src/auth/dto/login.dto';
import { LoginRateLimiterService } from '../../src/auth/services/login-rate-limiter.service';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('AuthService - login() & Security Guarantees', () => {
  let authService: AuthService;
  let rateLimiter: LoginRateLimiterService;
  let prisma: PrismaService;
  let jwtService: JwtService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const config: Record<string, any> = {
        'jwt.accessSecret': 'access_secret_32_chars_long_random_123',
        'jwt.accessExpiry': '15m',
        'jwt.refreshSecret': 'refresh_secret_32_chars_long_random_456',
        'jwt.refreshExpiry': '7d',
        'rateLimit.loginMax': 5,
        'rateLimit.windowMs': 60000,
      };
      return config[key] !== undefined ? config[key] : defaultValue;
    }),
  };

  let samplePasswordHash: string;

  beforeAll(async () => {
    samplePasswordHash = await argon2.hash('ValidPass123!');
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
    rateLimiter = module.get<LoginRateLimiterService>(LoginRateLimiterService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);

    jest.clearAllMocks();
    rateLimiter.clear();
  });

  const validLoginDto: LoginDto = {
    email: 'testuser@storerating.local',
    password: 'ValidPass123!',
  };

  const mockDbUser = {
    id: 'user-uuid-1',
    name: 'Alexander Montgomery James',
    email: 'testuser@storerating.local',
    address: '123 Meadowbrook Lane, Chicago, IL',
    password_hash: '',
    role: 'normal',
    created_at: new Date('2026-09-02T10:00:00Z'),
    updated_at: new Date('2026-09-02T10:00:00Z'),
  };

  it('should authenticate valid credentials, issue tokens, and store hashed refresh token in DB', async () => {
    mockDbUser.password_hash = samplePasswordHash;
    mockPrismaService.user.findUnique.mockResolvedValue(mockDbUser);
    mockPrismaService.user.update.mockResolvedValue(mockDbUser);
    mockJwtService.signAsync
      .mockResolvedValueOnce('mock_access_token_jwt')
      .mockResolvedValueOnce('mock_refresh_token_jwt');

    const result = await authService.login(validLoginDto);

    // 1. Verify returned response shape
    expect(result).toEqual({
      accessToken: 'mock_access_token_jwt',
      refreshToken: 'mock_refresh_token_jwt',
      user: {
        id: 'user-uuid-1',
        name: 'Alexander Montgomery James',
        email: 'testuser@storerating.local',
        address: '123 Meadowbrook Lane, Chicago, IL',
        role: 'normal',
        createdAt: mockDbUser.created_at,
        updatedAt: mockDbUser.updated_at,
      },
    });

    // 2. Ensure NO password field in response
    expect((result as any).password).toBeUndefined();
    expect((result as any).password_hash).toBeUndefined();
    expect((result.user as any).password_hash).toBeUndefined();

    // 3. Verify refresh token is stored hashed in DB
    expect(mockPrismaService.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-uuid-1' },
        data: expect.objectContaining({
          refresh_token_hash: expect.stringMatching(/^\$argon2/),
        }),
      }),
    );
  });

  it('should return identical "Invalid email or password" on wrong password', async () => {
    mockDbUser.password_hash = samplePasswordHash;
    mockPrismaService.user.findUnique.mockResolvedValue(mockDbUser);

    const wrongPasswordDto: LoginDto = {
      email: 'testuser@storerating.local',
      password: 'WrongPassword123!',
    };

    await expect(authService.login(wrongPasswordDto)).rejects.toThrow(
      new UnauthorizedException('Invalid email or password'),
    );
  });

  it('should return identical "Invalid email or password" when email does not exist', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue(null);

    const nonExistentDto: LoginDto = {
      email: 'nonexistent@storerating.local',
      password: 'AnyPassword123!',
    };

    await expect(authService.login(nonExistentDto)).rejects.toThrow(
      new UnauthorizedException('Invalid email or password'),
    );
  });

  it('should trigger rate-limit lockout on 6th attempt after 5 failed login attempts', async () => {
    mockDbUser.password_hash = samplePasswordHash;
    mockPrismaService.user.findUnique.mockResolvedValue(mockDbUser);

    const wrongPasswordDto: LoginDto = {
      email: 'bruteforce@storerating.local',
      password: 'WrongPassword123!',
    };

    // Attempts 1 to 5: All fail with 401 Unauthorized
    for (let i = 1; i <= 5; i++) {
      await expect(authService.login(wrongPasswordDto)).rejects.toThrow(UnauthorizedException);
    }

    // Attempt 6 (even with correct credentials): MUST throw 429 Too Many Requests
    const correctCredentialsDto: LoginDto = {
      email: 'bruteforce@storerating.local',
      password: 'ValidPass123!',
    };

    try {
      await authService.login(correctCredentialsDto);
      fail('Expected 429 HttpException but login succeeded');
    } catch (error: any) {
      expect(error).toBeInstanceOf(HttpException);
      expect(error.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
      expect(error.message).toContain('Too many failed login attempts');
    }
  });

  it('should reset failed attempts upon successful login', async () => {
    mockDbUser.password_hash = samplePasswordHash;
    mockPrismaService.user.findUnique.mockResolvedValue(mockDbUser);
    mockPrismaService.user.update.mockResolvedValue(mockDbUser);
    mockJwtService.signAsync.mockResolvedValue('token');

    const email = 'retryuser@storerating.local';

    // 2 failed attempts
    for (let i = 0; i < 2; i++) {
      await expect(
        authService.login({ email, password: 'WrongPassword123!' }),
      ).rejects.toThrow(UnauthorizedException);
    }

    // 1 successful login
    await authService.login({ email, password: 'ValidPass123!' });

    // Should now be able to attempt 5 more times before locking out
    for (let i = 1; i <= 4; i++) {
      await expect(
        authService.login({ email, password: 'WrongPassword123!' }),
      ).rejects.toThrow(UnauthorizedException);
    }
  });
});
