import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from '../../src/admin/admin.service';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('Admin Dashboard Metrics - AdminService', () => {
  let adminService: AdminService;
  let prisma: PrismaService;

  const mockPrismaService = {
    user: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    store: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    rating: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    adminService = module.get<AdminService>(AdminService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should retrieve counts using database-level count() queries without loading rows', async () => {
    mockPrismaService.user.count.mockResolvedValue(150);
    mockPrismaService.store.count.mockResolvedValue(45);
    mockPrismaService.rating.count.mockResolvedValue(820);

    const metrics = await adminService.getDashboardMetrics();

    // 1. Verify exact counts
    expect(metrics).toEqual({
      totalUsers: 150,
      totalStores: 45,
      totalRatings: 820,
    });

    // 2. Verify count() is called on all 3 tables
    expect(mockPrismaService.user.count).toHaveBeenCalledTimes(1);
    expect(mockPrismaService.store.count).toHaveBeenCalledTimes(1);
    expect(mockPrismaService.rating.count).toHaveBeenCalledTimes(1);

    // 3. Verify findMany() is NEVER called (no in-memory row counting)
    expect(mockPrismaService.user.findMany).not.toHaveBeenCalled();
    expect(mockPrismaService.store.findMany).not.toHaveBeenCalled();
    expect(mockPrismaService.rating.findMany).not.toHaveBeenCalled();
  });

  it('should return 0 for empty database tables without errors', async () => {
    mockPrismaService.user.count.mockResolvedValue(0);
    mockPrismaService.store.count.mockResolvedValue(0);
    mockPrismaService.rating.count.mockResolvedValue(0);

    const metrics = await adminService.getDashboardMetrics();

    expect(metrics).toEqual({
      totalUsers: 0,
      totalStores: 0,
      totalRatings: 0,
    });
  });
});
