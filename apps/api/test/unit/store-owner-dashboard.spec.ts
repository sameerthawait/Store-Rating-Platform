import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../src/prisma/prisma.service';
import { StoreOwnerService } from '../../src/store-owner/store-owner.service';

describe('Store Owner Dashboard - StoreOwnerService.getDashboard()', () => {
  let storeOwnerService: StoreOwnerService;
  let prisma: PrismaService;

  const mockPrismaService = {
    store: {
      findFirst: jest.fn(),
    },
    rating: {
      aggregate: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoreOwnerService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    storeOwnerService = module.get<StoreOwnerService>(StoreOwnerService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  const ownerUserId = 'owner-uuid-123';
  const mockStore = {
    id: 'store-uuid-abc',
    name: 'Apex Electronics Superstore',
    email: 'contact@apexelectronics.com',
    address: '100 Silicon Way, Tech District, San Francisco, CA',
    owner_id: ownerUserId,
  };

  it('should retrieve raters and computed average for the store owned by the JWT caller', async () => {
    mockPrismaService.store.findFirst.mockResolvedValue(mockStore);

    mockPrismaService.rating.aggregate.mockResolvedValue({
      _avg: { rating: 4.6666 },
      _count: { rating: 2 },
    });

    const mockRatings = [
      {
        id: 'rating-1',
        rating: 5,
        created_at: new Date('2026-09-02T10:00:00Z'),
        user: {
          id: 'rater-user-1',
          name: 'Charlotte Davis Shopper',
        },
      },
      {
        id: 'rating-2',
        rating: 4,
        created_at: new Date('2026-09-01T10:00:00Z'),
        user: {
          id: 'rater-user-2',
          name: 'Daniel Martinez Reviewer',
        },
      },
    ];

    mockPrismaService.rating.findMany.mockResolvedValue(mockRatings);

    const result = await storeOwnerService.getDashboard(ownerUserId);

    // 1. Verify store was queried by JWT owner_id
    expect(mockPrismaService.store.findFirst).toHaveBeenCalledWith({
      where: { owner_id: ownerUserId },
    });

    // 2. Verify store overview
    expect(result.store).toEqual({
      id: 'store-uuid-abc',
      name: 'Apex Electronics Superstore',
      email: 'contact@apexelectronics.com',
      address: '100 Silicon Way, Tech District, San Francisco, CA',
    });

    // 3. Verify computed average and count
    expect(result.averageRating).toBe(4.7);
    expect(result.totalRatings).toBe(2);

    // 4. Verify raters list
    expect(result.raters).toHaveLength(2);
    expect(result.raters[0]).toEqual({
      userId: 'rater-user-1',
      name: 'Charlotte Davis Shopper',
      rating: 5,
      submittedAt: expect.any(Date),
    });
  });

  it('should return empty raters array and null averageRating when store has 0 ratings', async () => {
    mockPrismaService.store.findFirst.mockResolvedValue(mockStore);

    mockPrismaService.rating.aggregate.mockResolvedValue({
      _avg: { rating: null },
      _count: { rating: 0 },
    });

    mockPrismaService.rating.findMany.mockResolvedValue([]);

    const result = await storeOwnerService.getDashboard(ownerUserId);

    expect(result.averageRating).toBeNull();
    expect(result.totalRatings).toBe(0);
    expect(result.raters).toEqual([]);
  });

  it('should throw 404 NotFoundException if store owner is not yet assigned to any store', async () => {
    mockPrismaService.store.findFirst.mockResolvedValue(null);

    await expect(storeOwnerService.getDashboard('unassigned-owner-id')).rejects.toThrow(
      new NotFoundException(
        'No store is currently assigned to your account — please contact an administrator',
      ),
    );

    expect(mockPrismaService.rating.aggregate).not.toHaveBeenCalled();
    expect(mockPrismaService.rating.findMany).not.toHaveBeenCalled();
  });
});
