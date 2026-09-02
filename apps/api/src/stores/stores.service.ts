import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Role as SharedRole } from '@ratehub/shared';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { PaginatedStoresResponseDto } from './dto/paginated-stores-response.dto';
import { PaginatedUserStoresResponseDto } from './dto/paginated-user-stores-response.dto';
import { QueryStoresDto } from './dto/query-stores.dto';
import { SearchStoresQueryDto } from './dto/search-stores-query.dto';
import { StoreResponseDto } from './dto/store-response.dto';
import { UserStoreItemDto } from './dto/user-store-item.dto';

@Injectable()
export class StoresService {
  private readonly logger = new Logger(StoresService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Admin-only store provisioning.
   * Atomically creates store and provisions/assigns store owner inside a database transaction.
   */
  async createStore(dto: CreateStoreDto): Promise<StoreResponseDto> {
    const normalizedStoreEmail = dto.email.toLowerCase().trim();

    // 1. Pre-check store email uniqueness
    const existingStore = await this.prisma.store.findUnique({
      where: { email: normalizedStoreEmail },
      select: { id: true },
    });

    if (existingStore) {
      throw new ConflictException('This store email is already registered');
    }

    if (!dto.ownerId && !dto.owner) {
      throw new BadRequestException('Either an ownerId or owner details must be provided');
    }

    // 2. Execute atomic creation inside a Prisma transaction
    const createdStore = await this.prisma.$transaction(async (tx) => {
      let resolvedOwnerId: string | null = null;
      let ownerUser: any = null;

      // Flow A: Inline Store Owner creation
      if (dto.owner) {
        const normalizedOwnerEmail = dto.owner.email.toLowerCase().trim();

        // Check if user email is taken
        const existingUser = await tx.user.findUnique({
          where: { email: normalizedOwnerEmail },
          select: { id: true },
        });

        if (existingUser) {
          throw new ConflictException('An account with this owner email already exists');
        }

        // Hash password securely with argon2
        const password_hash = await argon2.hash(dto.owner.password);

        ownerUser = await tx.user.create({
          data: {
            name: dto.owner.name.trim(),
            email: normalizedOwnerEmail,
            password_hash,
            address: dto.owner.address.trim(),
            role: 'store_owner',
          },
        });

        resolvedOwnerId = ownerUser.id;
      }
      // Flow B: Assign existing user as owner
      else if (dto.ownerId) {
        const existingUser = await tx.user.findUnique({
          where: { id: dto.ownerId },
        });

        if (!existingUser) {
          throw new NotFoundException('Specified owner user was not found');
        }

        // Ensure user has store_owner role
        ownerUser = await tx.user.update({
          where: { id: dto.ownerId },
          data: { role: 'store_owner' },
        });

        resolvedOwnerId = dto.ownerId;
      }

      // Create Store linked to resolved owner
      const store = await tx.store.create({
        data: {
          name: dto.name.trim(),
          email: normalizedStoreEmail,
          address: dto.address.trim(),
          owner_id: resolvedOwnerId,
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              address: true,
              role: true,
              created_at: true,
              updated_at: true,
            },
          },
        },
      });

      return store;
    });

    return {
      id: createdStore.id,
      name: createdStore.name,
      email: createdStore.email,
      address: createdStore.address,
      ownerId: createdStore.owner_id,
      averageRating: null,
      userRating: null,
      owner: createdStore.owner
        ? {
            id: createdStore.owner.id,
            name: createdStore.owner.name,
            email: createdStore.owner.email,
            address: createdStore.owner.address,
            role: createdStore.owner.role as SharedRole,
            createdAt: createdStore.owner.created_at,
            updatedAt: createdStore.owner.updated_at,
          }
        : null,
      createdAt: createdStore.created_at,
      updatedAt: createdStore.updated_at,
    };
  }

  /**
   * Admin-only paginated, sorted, and filtered store listing.
   * Features:
   * - Computes dynamic average ratings from ratings table.
   * - Supports sorting by computed average rating (nulls last) pushed to database.
   * - O(1) query complexity with zero N+1 row queries.
   */
  async listStores(query: QueryStoresDto): Promise<PaginatedStoresResponseDto> {
    const page = Number(query.page) > 0 ? Number(query.page) : 1;
    const limit = Number(query.limit) > 0 ? Math.min(Number(query.limit), 100) : 10;
    const skip = (page - 1) * limit;

    // 1. Build database WHERE clause
    const where: Prisma.StoreWhereInput = {};

    const nameFilter = query.filter?.name || query.name;
    if (nameFilter && nameFilter.trim() !== '') {
      where.name = { contains: nameFilter.trim(), mode: 'insensitive' };
    }

    const emailFilter = query.filter?.email || query.email;
    if (emailFilter && emailFilter.trim() !== '') {
      where.email = { contains: emailFilter.trim(), mode: 'insensitive' };
    }

    const addressFilter = query.filter?.address || query.address;
    if (addressFilter && addressFilter.trim() !== '') {
      where.address = { contains: addressFilter.trim(), mode: 'insensitive' };
    }

    // 2. Handle sorting by computed rating vs standard columns
    if (query.sort === 'rating') {
      const orderDir = (query.order || 'desc').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
      const searchName = nameFilter ? `%${nameFilter.trim()}%` : '%';
      const searchEmail = emailFilter ? `%${emailFilter.trim()}%` : '%';
      const searchAddress = addressFilter ? `%${addressFilter.trim()}%` : '%';

      const [rawStores, total] = await Promise.all([
        this.prisma.$queryRaw<any[]>`
          SELECT s.id, s.name, s.email, s.address, s.owner_id as "ownerId", 
                 s.created_at as "createdAt", s.updated_at as "updatedAt",
                 ROUND(AVG(r.rating)::numeric, 1)::float as "averageRating",
                 u.name as "ownerName", u.email as "ownerEmail", u.address as "ownerAddress", u.role as "ownerRole"
          FROM stores s
          LEFT JOIN ratings r ON s.id = r.store_id
          LEFT JOIN users u ON s.owner_id = u.id
          WHERE s.name ILIKE ${searchName}
            AND s.email ILIKE ${searchEmail}
            AND s.address ILIKE ${searchAddress}
          GROUP BY s.id, u.id
          ORDER BY AVG(r.rating) ${Prisma.raw(orderDir)} NULLS LAST, s.created_at DESC
          LIMIT ${limit} OFFSET ${skip}
        `,
        this.prisma.store.count({ where }),
      ]);

      const data: StoreResponseDto[] = rawStores.map((s) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        address: s.address,
        ownerId: s.ownerId,
        averageRating: s.averageRating !== null ? Number(s.averageRating) : null,
        userRating: null,
        owner: s.ownerId
          ? {
              id: s.ownerId,
              name: s.ownerName,
              email: s.ownerEmail,
              address: s.ownerAddress,
              role: s.ownerRole as SharedRole,
              createdAt: s.createdAt,
              updatedAt: s.updatedAt,
            }
          : null,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      }));

      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      };
    }

    // 3. Standard column sorting
    let sortField = query.sort || 'created_at';
    if (sortField === 'createdAt') sortField = 'created_at';
    if (sortField === 'updatedAt') sortField = 'updated_at';

    const orderDirection = (query.order || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';
    const orderBy: Prisma.StoreOrderByWithRelationInput = {
      [sortField]: orderDirection,
    };

    const [stores, total] = await Promise.all([
      this.prisma.store.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              address: true,
              role: true,
              created_at: true,
              updated_at: true,
            },
          },
        },
      }),
      this.prisma.store.count({ where }),
    ]);

    // Batch aggregate average ratings in ONE single query for the current page (no N+1)
    const storeIds = stores.map((s) => s.id);
    const avgRatings =
      storeIds.length > 0
        ? await this.prisma.rating.groupBy({
            by: ['store_id'],
            where: { store_id: { in: storeIds } },
            _avg: { rating: true },
          })
        : [];

    const avgMap = new Map(
      avgRatings.map((a) => [
        a.store_id,
        a._avg.rating !== null ? Number(a._avg.rating.toFixed(1)) : null,
      ]),
    );

    const data: StoreResponseDto[] = stores.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      address: s.address,
      ownerId: s.owner_id,
      averageRating: avgMap.get(s.id) ?? null,
      userRating: null,
      owner: s.owner
        ? {
            id: s.owner.id,
            name: s.owner.name,
            email: s.owner.email,
            address: s.owner.address,
            role: s.owner.role as SharedRole,
            createdAt: s.owner.created_at,
            updatedAt: s.owner.updated_at,
          }
        : null,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
    }));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Authenticated user store discovery endpoint.
   * Returns store list with overall average rating and caller's own submitted rating.
   * Supports case-insensitive search on Name and Address.
   */
  async listStoresForUser(
    userId: string,
    query: SearchStoresQueryDto,
  ): Promise<PaginatedUserStoresResponseDto> {
    const page = Number(query.page) > 0 ? Number(query.page) : 1;
    const limit = Number(query.limit) > 0 ? Math.min(Number(query.limit), 100) : 20;
    const skip = (page - 1) * limit;

    const where: Prisma.StoreWhereInput = {};

    if (query.search && query.search.trim() !== '') {
      const searchKeyword = query.search.trim();
      where.OR = [
        { name: { contains: searchKeyword, mode: 'insensitive' } },
        { address: { contains: searchKeyword, mode: 'insensitive' } },
      ];
    }

    const [stores, total] = await Promise.all([
      this.prisma.store.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          address: true,
        },
      }),
      this.prisma.store.count({ where }),
    ]);

    const storeIds = stores.map((s) => s.id);

    let avgMap = new Map<string, number | null>();
    let myRatingMap = new Map<string, number>();

    if (storeIds.length > 0) {
      const [avgRatings, myRatings] = await Promise.all([
        this.prisma.rating.groupBy({
          by: ['store_id'],
          where: { store_id: { in: storeIds } },
          _avg: { rating: true },
        }),
        userId
          ? this.prisma.rating.findMany({
              where: {
                user_id: userId,
                store_id: { in: storeIds },
              },
              select: {
                store_id: true,
                rating: true,
              },
            })
          : Promise.resolve([]),
      ]);

      avgMap = new Map(
        avgRatings.map((a) => [
          a.store_id,
          a._avg.rating !== null ? Number(a._avg.rating.toFixed(1)) : null,
        ]),
      );

      myRatingMap = new Map(myRatings.map((r) => [r.store_id, r.rating]));
    }

    const data: UserStoreItemDto[] = stores.map((s) => ({
      id: s.id,
      name: s.name,
      address: s.address,
      overallRating: avgMap.get(s.id) ?? null,
      myRating: myRatingMap.get(s.id) ?? null,
    }));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}
