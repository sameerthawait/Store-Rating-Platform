import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@ratehub/shared';
import * as argon2 from 'argon2';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PrismaService } from '../../src/prisma/prisma.service';
import { CreateStoreDto } from '../../src/stores/dto/create-store.dto';
import { StoresService } from '../../src/stores/stores.service';

describe('Admin Create Store - StoresService & CreateStoreDto', () => {
  let storesService: StoresService;
  let prisma: PrismaService;

  const mockTx = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    store: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockPrismaService = {
    store: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockTx)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoresService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    storesService = module.get<StoresService>(StoresService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  const validInlineStoreDto: CreateStoreDto = {
    name: 'Apex Electronics Superstore', // 27 chars
    email: 'contact@apexelectronics.com',
    address: '100 Silicon Way, Tech District, San Francisco, CA',
    owner: {
      name: 'Marcus Vance Tech Lead',
      email: 'marcus.vance@apexelectronics.com',
      password: 'OwnerSecretP@ss1',
      address: '100 Silicon Way, San Francisco, CA',
    },
  };

  describe('CreateStoreDto Validation Boundaries', () => {
    const createDto = (data: Partial<CreateStoreDto>) => {
      return plainToInstance(CreateStoreDto, { ...validInlineStoreDto, ...data });
    };

    it('should PASS on valid store name, email, address, and inline owner', async () => {
      const dto = createDto({});
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should FAIL when store name is less than 20 characters', async () => {
      const dto = createDto({ name: 'Short Store' }); // 11 chars
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'name')).toBe(true);
    });

    it('should FAIL when store name exceeds 60 characters', async () => {
      const dto = createDto({ name: 's'.repeat(61) });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'name')).toBe(true);
    });

    it('should FAIL on malformed store email', async () => {
      const dto = createDto({ email: 'not-a-valid-email' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'email')).toBe(true);
    });

    it('should FAIL when store address exceeds 400 characters', async () => {
      const dto = createDto({ address: 'a'.repeat(401) });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'address')).toBe(true);
    });
  });

  describe('StoresService.createStore() - Atomic Transaction Execution', () => {
    it('should create store and inline owner atomically inside $transaction', async () => {
      mockPrismaService.store.findUnique.mockResolvedValue(null);
      mockTx.user.findUnique.mockResolvedValue(null);

      const createdOwner = {
        id: 'owner-uuid-1',
        name: 'Marcus Vance Tech Lead',
        email: 'marcus.vance@apexelectronics.com',
        address: '100 Silicon Way, San Francisco, CA',
        role: 'store_owner',
        created_at: new Date(),
        updated_at: new Date(),
      };

      const createdStore = {
        id: 'store-uuid-1',
        name: 'Apex Electronics Superstore',
        email: 'contact@apexelectronics.com',
        address: '100 Silicon Way, Tech District, San Francisco, CA',
        owner_id: 'owner-uuid-1',
        owner: createdOwner,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockTx.user.create.mockResolvedValue(createdOwner);
      mockTx.store.create.mockResolvedValue(createdStore);

      const result = await storesService.createStore(validInlineStoreDto);

      expect(mockPrismaService.$transaction).toHaveBeenCalled();

      // Verify owner created with role store_owner
      expect(mockTx.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            role: 'store_owner',
            password_hash: expect.stringMatching(/^\$argon2/),
          }),
        }),
      );

      // Verify store created with owner_id
      expect(mockTx.store.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            owner_id: 'owner-uuid-1',
          }),
        }),
      );

      expect(result.id).toBe('store-uuid-1');
      expect(result.owner?.role).toBe(Role.STORE_OWNER);
    });

    it('should create store assigning an existing user as store_owner', async () => {
      mockPrismaService.store.findUnique.mockResolvedValue(null);

      const existingUser = {
        id: 'existing-user-uuid',
        name: 'Existing User',
        email: 'existing@storerating.local',
        address: '123 Test St',
        role: 'normal',
      };

      mockTx.user.findUnique.mockResolvedValue(existingUser);
      mockTx.user.update.mockResolvedValue({ ...existingUser, role: 'store_owner' });
      mockTx.store.create.mockResolvedValue({
        id: 'store-uuid-2',
        name: 'Apex Electronics Superstore',
        email: 'contact@apexelectronics.com',
        address: '100 Silicon Way, San Francisco, CA',
        owner_id: 'existing-user-uuid',
        owner: { ...existingUser, role: 'store_owner', created_at: new Date(), updated_at: new Date() },
        created_at: new Date(),
        updated_at: new Date(),
      });

      const dto: CreateStoreDto = {
        name: 'Apex Electronics Superstore',
        email: 'contact@apexelectronics.com',
        address: '100 Silicon Way, San Francisco, CA',
        ownerId: 'existing-user-uuid',
      };

      const result = await storesService.createStore(dto);

      expect(mockTx.user.update).toHaveBeenCalledWith({
        where: { id: 'existing-user-uuid' },
        data: { role: 'store_owner' },
      });
      expect(result.ownerId).toBe('existing-user-uuid');
    });

    it('should throw 409 Conflict if store email is already taken', async () => {
      mockPrismaService.store.findUnique.mockResolvedValue({ id: 'existing-store-id' });

      await expect(storesService.createStore(validInlineStoreDto)).rejects.toThrow(
        new ConflictException('This store email is already registered'),
      );

      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });

    it('should throw 409 Conflict if inline owner email is already taken inside transaction', async () => {
      mockPrismaService.store.findUnique.mockResolvedValue(null);
      mockTx.user.findUnique.mockResolvedValue({ id: 'existing-owner-id' });

      await expect(storesService.createStore(validInlineStoreDto)).rejects.toThrow(
        new ConflictException('An account with this owner email already exists'),
      );

      expect(mockTx.store.create).not.toHaveBeenCalled();
    });

    it('should abort and rollback transaction if store creation fails mid-transaction', async () => {
      mockPrismaService.store.findUnique.mockResolvedValue(null);
      mockTx.user.findUnique.mockResolvedValue(null);
      mockTx.user.create.mockResolvedValue({ id: 'owner-id' });
      mockTx.store.create.mockRejectedValue(new Error('Database disk error'));

      await expect(storesService.createStore(validInlineStoreDto)).rejects.toThrow(
        'Database disk error',
      );
    });
  });
});
