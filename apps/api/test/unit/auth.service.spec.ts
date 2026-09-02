import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as argon2 from 'argon2';
import { AuthService } from '../../src/auth/auth.service';
import { SignupDto } from '../../src/auth/dto/signup.dto';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('AuthService - signup()', () => {
  let service: AuthService;
  let prisma: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  const validDto: SignupDto = {
    name: 'Alexander Montgomery James',
    email: 'alexander@example.com',
    address: '123 Meadowbrook Lane, Suite 400, Chicago, IL',
    password: 'SecretPass123!',
  };

  it('should successfully register a normal user with argon2 hashed password', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue(null);

    mockPrismaService.user.create.mockImplementation(({ data, select }) => {
      return Promise.resolve({
        id: 'uuid-123',
        name: data.name,
        email: data.email,
        address: data.address,
        role: data.role,
        created_at: new Date('2026-09-02T10:00:00Z'),
        updated_at: new Date('2026-09-02T10:00:00Z'),
      });
    });

    const result = await service.signup(validDto);

    // Verify findUnique called with normalized email
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'alexander@example.com' },
      select: { id: true },
    });

    // Verify user.create called with role 'normal'
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Alexander Montgomery James',
          email: 'alexander@example.com',
          role: 'normal',
        }),
      }),
    );

    // Verify password was hashed with argon2
    const createCallArgs = mockPrismaService.user.create.mock.calls[0][0];
    const passwordHash = createCallArgs.data.password_hash;
    expect(passwordHash).not.toEqual(validDto.password);
    expect(passwordHash.startsWith('$argon2')).toBe(true);
    const isPasswordValid = await argon2.verify(passwordHash, validDto.password);
    expect(isPasswordValid).toBe(true);

    // Verify returned object fields and NO password_hash leakage
    expect(result).toEqual({
      id: 'uuid-123',
      name: 'Alexander Montgomery James',
      email: 'alexander@example.com',
      address: '123 Meadowbrook Lane, Suite 400, Chicago, IL',
      role: 'normal',
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
    expect((result as any).password_hash).toBeUndefined();
    expect((result as any).password).toBeUndefined();
    expect((result as any).refresh_token_hash).toBeUndefined();
  });

  it('should reject duplicate email with 409 ConflictException', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue({ id: 'existing-uuid' });

    await expect(service.signup(validDto)).rejects.toThrow(
      new ConflictException('An account with this email already exists'),
    );

    // Verify user.create was NOT called
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('should never allow overriding role to admin or store_owner', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue(null);
    mockPrismaService.user.create.mockImplementation(({ data }) =>
      Promise.resolve({
        id: 'uuid-123',
        name: data.name,
        email: data.email,
        address: data.address,
        role: data.role,
        created_at: new Date(),
        updated_at: new Date(),
      }),
    );

    // Even if an attacker injects role: 'admin' into the DTO/payload object
    const maliciousPayload = {
      ...validDto,
      role: 'admin',
    } as any;

    const result = await service.signup(maliciousPayload);

    // Verify user was created strictly with role 'normal'
    const createCallArgs = mockPrismaService.user.create.mock.calls[0][0];
    expect(createCallArgs.data.role).toBe('normal');
    expect(result.role).toBe('normal');
  });
});
