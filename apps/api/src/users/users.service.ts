import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Role as SharedRole } from '@ratehub/shared';
import * as argon2 from 'argon2';
import { UserResponseDto } from '../auth/dto/user-response.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { PaginatedUsersResponseDto } from './dto/paginated-users-response.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { UserDetailResponseDto } from './dto/user-detail-response.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Admin-only user provisioning.
   * Creates either a normal or admin user with argon2 password hashing.
   */
  async createUser(dto: CreateUserDto): Promise<UserResponseDto> {
    const normalizedEmail = dto.email.toLowerCase().trim();

    // 1. Check for duplicate email
    const existing = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('This email is already registered');
    }

    // 2. Hash password securely with argon2
    const password_hash = await argon2.hash(dto.password);

    // 3. Persist user with specified role
    const user = await this.prisma.user.create({
      data: {
        name: dto.name.trim(),
        email: normalizedEmail,
        password_hash,
        address: dto.address.trim(),
        role: dto.role as any,
      },
      select: {
        id: true,
        name: true,
        email: true,
        address: true,
        role: true,
        created_at: true,
        updated_at: true,
      },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      address: user.address,
      role: user.role as SharedRole,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };
  }

  /**
   * Admin-only paginated, sorted, and filtered user listing.
   * All filter/sort/pagination clauses are pushed down to PostgreSQL query.
   */
  async listUsers(query: QueryUsersDto): Promise<PaginatedUsersResponseDto> {
    const page = Number(query.page) > 0 ? Number(query.page) : 1;
    const limit = Number(query.limit) > 0 ? Math.min(Number(query.limit), 100) : 10;
    const skip = (page - 1) * limit;

    // Build database WHERE clause
    const where: Prisma.UserWhereInput = {};

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

    const roleFilter = query.filter?.role || query.role;
    if (roleFilter) {
      where.role = { equals: roleFilter as any };
    }

    // Build database ORDER BY clause
    let sortField = query.sort || 'created_at';
    if (sortField === 'createdAt') sortField = 'created_at';
    if (sortField === 'updatedAt') sortField = 'updated_at';

    const orderDirection = (query.order || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';
    const orderBy: Prisma.UserOrderByWithRelationInput = {
      [sortField]: orderDirection,
    };

    // Execute database-pushed query & count in parallel
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          address: true,
          role: true,
          created_at: true,
          updated_at: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const mappedUsers: UserResponseDto[] = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      address: u.address,
      role: u.role as SharedRole,
      createdAt: u.created_at,
      updatedAt: u.updated_at,
    }));

    return {
      data: mappedUsers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Admin-only user detail retrieval.
   * If role === store_owner, dynamically calculates and includes their store's average rating.
   * If role === normal or admin, omits any store/rating fields cleanly.
   */
  async getUserById(userId: string): Promise<UserDetailResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        storesOwned: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const baseProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      address: user.address,
      role: user.role as SharedRole,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };

    // For normal and admin roles, omit store/rating property entirely
    if (user.role !== 'store_owner') {
      return baseProfile;
    }

    // For store_owner role, compute average rating for their owned store
    const store = user.storesOwned[0] || null;
    let storeSummary = null;

    if (store) {
      const ratingAgg = await this.prisma.rating.aggregate({
        where: { store_id: store.id },
        _avg: { rating: true },
      });

      const averageRating =
        ratingAgg._avg.rating !== null
          ? Number(ratingAgg._avg.rating.toFixed(1))
          : null;

      storeSummary = {
        id: store.id,
        name: store.name,
        address: store.address,
        averageRating,
      };
    }

    return {
      ...baseProfile,
      store: storeSummary,
    };
  }
}
