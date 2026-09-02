import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../src/prisma/prisma.service';
import { QueryStoresDto } from '../../src/stores/dto/query-stores.dto';
import { StoresService } from '../../src/stores/stores.service';

describe('Admin List Stores - StoresService.listStores()', () => {
  let storesService: StoresService;
  let prisma: PrismaService;

  const mockPrismaService = {
    store: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    rating: {
      groupBy: jest.fn(),
    },
    $queryRaw: jest.fn(),
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
      email: 'contact@apexelectronics.com',
      address: '100 Silicon Way, San Francisco, CA',
      owner_id: 'owner-1',
      created_at: new Date('2026-09-02T10:00:00Z'),
      updated_at: new Date('2026-09-02T10:00:00Z'),
      owner: {
        id: 'owner-1',
        name: 'Marcus Vance Tech Lead',
        email: 'marcus@apexelectronics.com',
        address: '100 Silicon Way, San Francisco, CA',
        role: 'store_owner',
        created_at: new Date('2026-09-02T10:00:00Z'),
        updated_at: new Date('2026-09-02T10:00:00Z'),
      },
    },
    {
      id: 'store-2',
      name: 'Artisan Coffee Roasters',
      email: 'hello@artisancoffeeroasters.com',
      address: '250 Roast Lane, Seattle, WA',
      owner_id: 'owner-2',
      created_at: new Date('2026-09-01T10:00:00Z'),
      updated_at: new Date('2026-09-01T10:00:00Z'),
      owner: {
        id: 'owner-2',
        name: 'Elena Rostova Coffee Lead',
        email: 'elena@artisancoffeeroasters.com',
        address: '250 Roast Lane, Seattle, WA',
        role: 'store_owner',
        created_at: new Date('2026-09-01T10:00:00Z'),
        updated_at: new Date('2026-09-01T10:00:00Z'),
      },
    },
  ];

  it('should list stores with batch computed average ratings in ONE query (no N+1)', async () => {
    mockPrismaService.store.findMany.mockResolvedValue(mockStores);
    mockPrismaService.store.count.mockResolvedValue(2);
    // Batch groupBy for the 2 stores
    mockPrismaService.rating.groupBy.mockResolvedValue([
      { store_id: 'store-1', _avg: { rating: 4.6666 } },
      // store-2 has no ratings (empty in groupBy)
    ]);

    const query: QueryStoresDto = { page: 1, limit: 10 };
    const result = await storesService.listStores(query);

    // 1. Verify batch groupBy called exactly once with all store IDs on current page
    expect(mockPrismaService.rating.groupBy).toHaveBeenCalledTimes(1);
    expect(mockPrismaService.rating.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { store_id: { in: ['store-1', 'store-2'] } },
      }),
    );

    // 2. Verify store-1 has rounded computed rating 4.7
    expect(result.data[0].averageRating).toBe(4.7);

    // 3. Verify store-2 with 0 ratings returns null (not 0)
    expect(result.data[1].averageRating).toBeNull();
    expect(result.total).toBe(2);
  });

  it('should push sorting by computed average rating to the database query with NULLS LAST', async () => {
    const rawSqlResults = [
      {
        id: 'store-1',
        name: 'Apex Electronics Superstore',
        email: 'contact@apexelectronics.com',
        address: '100 Silicon Way, San Francisco, CA',
        ownerId: 'owner-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        averageRating: 4.8,
        ownerName: 'Marcus Vance',
        ownerEmail: 'marcus@apexelectronics.com',
        ownerAddress: '100 Silicon Way',
        ownerRole: 'store_owner',
      },
      {
        id: 'store-2',
        name: 'Artisan Coffee Roasters',
        email: 'hello@artisancoffee.com',
        address: '250 Roast Lane',
        ownerId: 'owner-2',
        createdAt: new Date(),
        updatedAt: new Date(),
        averageRating: null, // Nulls last
        ownerName: 'Elena Rostova',
        ownerEmail: 'elena@artisancoffee.com',
        ownerAddress: '250 Roast Lane',
        ownerRole: 'store_owner',
      },
    ];

    mockPrismaService.$queryRaw.mockResolvedValue(rawSqlResults);
    mockPrismaService.store.count.mockResolvedValue(2);

    const query: QueryStoresDto = { sort: 'rating', order: 'desc', page: 1, limit: 10 };
    const result = await storesService.listStores(query);

    expect(mockPrismaService.$queryRaw).toHaveBeenCalledTimes(1);
    expect(result.data[0].averageRating).toBe(4.8);
    expect(result.data[1].averageRating).toBeNull();
  });

  it('should filter stores by name, email, and address with case-insensitive contains', async () => {
    mockPrismaService.store.findMany.mockResolvedValue([mockStores[0]]);
    mockPrismaService.store.count.mockResolvedValue(1);
    mockPrismaService.rating.groupBy.mockResolvedValue([]);

    const query: QueryStoresDto = {
      name: 'electronics',
      email: 'apexelectronics',
      address: 'silicon',
    };

    const result = await storesService.listStores(query);

    expect(mockPrismaService.store.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          name: { contains: 'electronics', mode: 'insensitive' },
          email: { contains: 'apexelectronics', mode: 'insensitive' },
          address: { contains: 'silicon', mode: 'insensitive' },
        },
      }),
    );
    expect(result.data.length).toBe(1);
  });
});
