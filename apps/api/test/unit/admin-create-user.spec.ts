import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@ratehub/shared';
import * as argon2 from 'argon2';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PrismaService } from '../../src/prisma/prisma.service';
import { CreateUserDto } from '../../src/users/dto/create-user.dto';
import { UsersService } from '../../src/users/users.service';

describe('Admin Create User - UsersService & CreateUserDto', () => {
  let usersService: UsersService;
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
        UsersService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  const validBaseDto: CreateUserDto = {
    name: 'Alexander Montgomery James',
    email: 'newadmin@storerating.local',
    address: '742 Evergreen Terrace, Platform HQ, Springfield',
    password: 'AdminSecretP@ss1',
    role: Role.ADMIN,
  };

  describe('CreateUserDto Validation Boundaries', () => {
    const createDto = (data: Partial<CreateUserDto>) => {
      return plainToInstance(CreateUserDto, { ...validBaseDto, ...data });
    };

    it('should PASS on valid admin role', async () => {
      const dto = createDto({ role: Role.ADMIN });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should PASS on valid normal role', async () => {
      const dto = createDto({ role: Role.NORMAL });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should FAIL on store_owner role (store owners are provisioned via store flow)', async () => {
      const dto = createDto({ role: 'store_owner' as any });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'role')).toBe(true);
    });

    it('should FAIL on invalid role string', async () => {
      const dto = createDto({ role: 'superadmin' as any });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'role')).toBe(true);
    });

    it('should FAIL when name is below 20 characters', async () => {
      const dto = createDto({ name: 'Short Name' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'name')).toBe(true);
    });

    it('should FAIL when password lacks uppercase or special character', async () => {
      const dto1 = createDto({ password: 'alllowercase123!' });
      const errors1 = await validate(dto1);
      expect(errors1.some((e) => e.property === 'password')).toBe(true);

      const dto2 = createDto({ password: 'NoSpecialChar1234' });
      const errors2 = await validate(dto2);
      expect(errors2.some((e) => e.property === 'password')).toBe(true);
    });
  });

  describe('UsersService.createUser()', () => {
    it('should successfully create an admin user with Argon2 password hashing', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockImplementation(({ data }) =>
        Promise.resolve({
          id: 'user-uuid-999',
          name: data.name,
          email: data.email,
          address: data.address,
          role: data.role,
          created_at: new Date('2026-09-02T10:00:00Z'),
          updated_at: new Date('2026-09-02T10:00:00Z'),
        }),
      );

      const result = await usersService.createUser(validBaseDto);

      expect(result).toEqual({
        id: 'user-uuid-999',
        name: 'Alexander Montgomery James',
        email: 'newadmin@storerating.local',
        address: '742 Evergreen Terrace, Platform HQ, Springfield',
        role: Role.ADMIN,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });

      // Verify no password hash is returned
      expect((result as any).password_hash).toBeUndefined();
      expect((result as any).password).toBeUndefined();

      // Verify user was created in DB with argon2 hash
      const createCall = mockPrismaService.user.create.mock.calls[0][0];
      expect(createCall.data.role).toBe(Role.ADMIN);
      const isHashValid = await argon2.verify(
        createCall.data.password_hash,
        validBaseDto.password,
      );
      expect(isHashValid).toBe(true);
    });

    it('should throw 409 Conflict if email is already registered', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'existing-id' });

      await expect(usersService.createUser(validBaseDto)).rejects.toThrow(
        new ConflictException('This email is already registered'),
      );

      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
    });
  });
});
