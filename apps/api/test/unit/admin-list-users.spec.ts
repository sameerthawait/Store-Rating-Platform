import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@ratehub/shared';
import { PrismaService } from '../../src/prisma/prisma.service';
import { QueryUsersDto } from '../../src/users/dto/query-users.dto';
import { UsersService } from '../../src/users/users.service';

describe('Admin List Users - UsersService.listUsers()', () => {
  let usersService: UsersService;
  let prisma: PrismaService;

  const mockPrismaService = {
    user: {
      findMany: jest.fn(),
      count: jest.fn(),
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

  const mockUsersList = [
    {
      id: 'user-1',
      name: 'Alexander Montgomery James',
      email: 'alexander@storerating.local',
      address: '100 Main St, Chicago, IL',
      role: 'admin',
      created_at: new Date('2026-09-02T10:00:00Z'),
      updated_at: new Date('2026-09-02T10:00:00Z'),
    },
    {
      id: 'user-2',
      name: 'Charlotte Davis Shopper',
      email: 'charlotte@storerating.local',
      address: '200 Oak St, Miami, FL',
      role: 'normal',
      created_at: new Date('2026-09-01T10:00:00Z'),
      updated_at: new Date('2026-09-01T10:00:00Z'),
    },
  ];

  it('should push sorting parameters directly to database query (ascending & descending)', async () => {
    mockPrismaService.user.findMany.mockResolvedValue(mockUsersList);
    mockPrismaService.user.count.mockResolvedValue(2);

    // 1. Sort by name asc
    const queryAsc: QueryUsersDto = { sort: 'name', order: 'asc', page: 1, limit: 10 };
    await usersService.listUsers(queryAsc);

    expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { name: 'asc' },
        skip: 0,
        take: 10,
      }),
    );

    // 2. Sort by role desc
    const queryDesc: QueryUsersDto = { sort: 'role', order: 'desc', page: 2, limit: 5 };
    await usersService.listUsers(queryDesc);

    expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { role: 'desc' },
        skip: 5,
        take: 5,
      }),
    );
  });

  it('should push text filtering (case-insensitive contains) and role filtering (exact) to DB query', async () => {
    mockPrismaService.user.findMany.mockResolvedValue([mockUsersList[0]]);
    mockPrismaService.user.count.mockResolvedValue(1);

    const query: QueryUsersDto = {
      name: 'alex',
      email: 'storerating',
      role: Role.ADMIN,
    };

    const result = await usersService.listUsers(query);

    expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          name: { contains: 'alex', mode: 'insensitive' },
          email: { contains: 'storerating', mode: 'insensitive' },
          role: { equals: Role.ADMIN },
        },
      }),
    );

    expect(result.data.length).toBe(1);
    expect(result.total).toBe(1);
  });

  it('should support nested filter[field] parameters with AND logic', async () => {
    mockPrismaService.user.findMany.mockResolvedValue([]);
    mockPrismaService.user.count.mockResolvedValue(0);

    const query: QueryUsersDto = {
      filter: {
        name: 'james',
        address: 'chicago',
        role: Role.NORMAL,
      },
    };

    await usersService.listUsers(query);

    expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          name: { contains: 'james', mode: 'insensitive' },
          address: { contains: 'chicago', mode: 'insensitive' },
          role: { equals: Role.NORMAL },
        },
      }),
    );
  });

  it('should calculate accurate pagination metadata', async () => {
    mockPrismaService.user.findMany.mockResolvedValue(mockUsersList);
    mockPrismaService.user.count.mockResolvedValue(45);

    const query: QueryUsersDto = { page: 3, limit: 10 };
    const result = await usersService.listUsers(query);

    expect(result.page).toBe(3);
    expect(result.limit).toBe(10);
    expect(result.total).toBe(45);
    expect(result.totalPages).toBe(5);

    expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 20,
        take: 10,
      }),
    );
  });

  it('should never include password hashes in the returned records', async () => {
    mockPrismaService.user.findMany.mockResolvedValue(mockUsersList);
    mockPrismaService.user.count.mockResolvedValue(2);

    const result = await usersService.listUsers({});

    result.data.forEach((user) => {
      expect((user as any).password_hash).toBeUndefined();
      expect((user as any).password).toBeUndefined();
      expect((user as any).refresh_token_hash).toBeUndefined();
    });
  });
});
