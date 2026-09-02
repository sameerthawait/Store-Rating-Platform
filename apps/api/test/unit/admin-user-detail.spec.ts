import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@ratehub/shared';
import { PrismaService } from '../../src/prisma/prisma.service';
import { UsersService } from '../../src/users/users.service';

describe('Admin Get User Detail - UsersService.getUserById()', () => {
  let usersService: UsersService;
  let prisma: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
    rating: {
      aggregate: jest.fn(),
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

  it('should throw 404 NotFoundException if user id does not exist', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue(null);

    await expect(usersService.getUserById('non-existent-uuid')).rejects.toThrow(
      new NotFoundException('User not found'),
    );
  });

  it('should omit any store/rating fields when user role is normal', async () => {
    const mockNormalUser = {
      id: 'normal-user-id',
      name: 'Alice Walker Shopper',
      email: 'alice@storerating.local',
      address: '12 Maple Road, Chicago, IL',
      role: 'normal',
      storesOwned: [],
      created_at: new Date('2026-09-02T10:00:00Z'),
      updated_at: new Date('2026-09-02T10:00:00Z'),
    };

    mockPrismaService.user.findUnique.mockResolvedValue(mockNormalUser);

    const result = await usersService.getUserById('normal-user-id');

    expect(result).toEqual({
      id: 'normal-user-id',
      name: 'Alice Walker Shopper',
      email: 'alice@storerating.local',
      address: '12 Maple Road, Chicago, IL',
      role: Role.NORMAL,
      createdAt: mockNormalUser.created_at,
      updatedAt: mockNormalUser.updated_at,
    });

    // Rating / store field MUST NOT exist at all
    expect((result as any).store).toBeUndefined();
    expect((result as any).averageRating).toBeUndefined();
    expect((result as any).password_hash).toBeUndefined();
    expect(mockPrismaService.rating.aggregate).not.toHaveBeenCalled();
  });

  it('should omit any store/rating fields when user role is admin', async () => {
    const mockAdminUser = {
      id: 'admin-user-id',
      name: 'System Administrator',
      email: 'admin@storerating.local',
      address: '742 Evergreen Terrace, Platform HQ',
      role: 'admin',
      storesOwned: [],
      created_at: new Date('2026-09-02T10:00:00Z'),
      updated_at: new Date('2026-09-02T10:00:00Z'),
    };

    mockPrismaService.user.findUnique.mockResolvedValue(mockAdminUser);

    const result = await usersService.getUserById('admin-user-id');

    expect(result.role).toBe(Role.ADMIN);
    expect((result as any).store).toBeUndefined();
    expect((result as any).averageRating).toBeUndefined();
    expect((result as any).password_hash).toBeUndefined();
  });

  it('should include store details and computed average rating when role is store_owner', async () => {
    const mockStoreOwner = {
      id: 'owner-user-id',
      name: 'Marcus Vance Tech Owner',
      email: 'marcus@apexelectronics.com',
      address: '100 Silicon Way, San Francisco, CA',
      role: 'store_owner',
      storesOwned: [
        {
          id: 'store-uuid-1',
          name: 'Apex Electronics Superstore',
          address: '100 Silicon Way, Tech District, San Francisco, CA',
          owner_id: 'owner-user-id',
        },
      ],
      created_at: new Date('2026-09-02T10:00:00Z'),
      updated_at: new Date('2026-09-02T10:00:00Z'),
    };

    mockPrismaService.user.findUnique.mockResolvedValue(mockStoreOwner);
    mockPrismaService.rating.aggregate.mockResolvedValue({
      _avg: { rating: 4.6666666 },
    });

    const result = await usersService.getUserById('owner-user-id');

    expect(result.role).toBe(Role.STORE_OWNER);
    expect(result.store).toBeDefined();
    expect(result.store?.id).toBe('store-uuid-1');
    expect(result.store?.name).toBe('Apex Electronics Superstore');
    expect(result.store?.averageRating).toBe(4.7); // Rounded to 1 decimal place

    // Verify rating aggregate was queried for store
    expect(mockPrismaService.rating.aggregate).toHaveBeenCalledWith({
      where: { store_id: 'store-uuid-1' },
      _avg: { rating: true },
    });

    expect((result as any).password_hash).toBeUndefined();
  });
});
