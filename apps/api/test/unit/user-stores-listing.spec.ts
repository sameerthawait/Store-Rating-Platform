import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../src/prisma/prisma.service';
import { SearchStoresQueryDto } from '../../src/stores/dto/search-stores-query.dto';
import { StoresService } from '../../src/stores/stores.service';

describe('User Stores Listing - StoresService.listStoresForUser()', () => {
  let storesService: StoresService;
  let prisma: PrismaService;

  const mockPrismaService = {
    store: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    rating: {
      groupBy: jest.fn(),
      findMany: jest.fn(),
    },
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

  const mockStores = [
    {
      id: 'store-1',
      name: 'Apex Electronics Superstore',
      address: '100 Silicon Way, San Francisco, CA',
    },
    {
      id: 'store-2',
      name: 'Artisan Coffee Roasters',
      address: '250 Roast Lane, Seattle, WA',
    },
    {
      id: 'store-3',
      name: 'Fresh Harvest Market',
      address: '77 Greenway Blvd, Portland, OR',
    },
  ];

  it('should return overallRating and user own myRating scoped strictly to caller', async () => {
    const callerUserId = 'current-user-uuid';

    mockPrismaService.store.findMany.mockResolvedValue(mockStores);
    mockPrismaService.store.count.mockResolvedValue(3);

    // Overall aggregate averages across all users
    mockPrismaService.rating.groupBy.mockResolvedValue([
      { store_id: 'store-1', _avg: { rating: 4.6666 } },
      { store_id: 'store-2', _avg: { rating: 3.5 } },
      // store-3 has 0 ratings
    ]);

    // Caller's own ratings: caller rated store-1 (5 stars), but hasn't rated store-2 or store-3
    mockPrismaService.rating.findMany.mockResolvedValue([
      { store_id: 'store-1', rating: 5 },
    ]);

    const result = await storesService.listStoresForUser(callerUserId, { page: 1, limit: 20 });

    // Verify rating queries
    expect(mockPrismaService.rating.findMany).toHaveBeenCalledWith({
      where: {
        user_id: callerUserId,
        store_id: { in: ['store-1', 'store-2', 'store-3'] },
      },
      select: {
        store_id: true,
        rating: true,
      },
    });

    // Store 1: rated by others (avg 4.7) and rated 5 by caller
    expect(result.data[0]).toEqual({
      id: 'store-1',
      name: 'Apex Electronics Superstore',
      address: '100 Silicon Way, San Francisco, CA',
      overallRating: 4.7,
      myRating: 5,
    });

    // Store 2: rated by others (avg 3.5), but NOT rated by caller (null)
    expect(result.data[1]).toEqual({
      id: 'store-2',
      name: 'Artisan Coffee Roasters',
      address: '250 Roast Lane, Seattle, WA',
      overallRating: 3.5,
      myRating: null,
    });

    // Store 3: 0 overall ratings (null), not rated by caller (null)
    expect(result.data[2]).toEqual({
      id: 'store-3',
      name: 'Fresh Harvest Market',
      address: '77 Greenway Blvd, Portland, OR',
      overallRating: null,
      myRating: null,
    });
  });

  it('should filter stores matching search keyword against Name OR Address case-insensitively', async () => {
    mockPrismaService.store.findMany.mockResolvedValue([mockStores[1]]);
    mockPrismaService.store.count.mockResolvedValue(1);
    mockPrismaService.rating.groupBy.mockResolvedValue([]);
    mockPrismaService.rating.findMany.mockResolvedValue([]);

    const query: SearchStoresQueryDto = { search: 'seattle' };
    await storesService.listStoresForUser('user-id', query);

    expect(mockPrismaService.store.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { name: { contains: 'seattle', mode: 'insensitive' } },
            { address: { contains: 'seattle', mode: 'insensitive' } },
          ],
        },
      }),
    );
  });
});
