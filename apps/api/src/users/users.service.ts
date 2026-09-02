import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  Role as SharedRole,
  USER_VALIDATION,
} from '@ratehub/shared';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { PaginatedUsersResponseDto } from './dto/paginated-users-response.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { UserDetailResponseDto } from './dto/user-detail-response.dto';
import { UserResponseDto } from '../auth/dto/user-response.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Admin-only user creation endpoint.
   * Can create users with role 'normal' or 'admin' only.
   */
  async createUser(dto: CreateUserDto): Promise<UserResponseDto> {
    const normalizedEmail = dto.email.trim().toLowerCase();

    // 1. Enforce business rule: only 'normal' and 'admin' roles can be created directly here
    if (dto.role === 'store_owner') {
      throw new BadRequestException(
        'Store owners must be created via the store creation flow (POST /api/v1/admin/stores).',
      );
    }

    // 2. Validate Password policy matching signup rules
    if (!USER_VALIDATION.PASSWORD_REGEX.test(dto.password)) {
      throw new BadRequestException(USER_VALIDATION.PASSWORD_REQUIREMENTS_MESSAGE);
    }

    // 3. Check for existing email conflict
    const existing = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      throw new ConflictException('An account with this email address already exists.');
    }

    // 4. Hash password with Argon2id
    const password_hash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    // 5. Create user in database
    const user = await this.prisma.user.create({
      data: {
        name: dto.name.trim(),
        email: normalizedEmail,
        password_hash,
        address: dto.address.trim(),
        role: dto.role as any,
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
   * Admin-only listing of users with database-pushed filtering, sorting, and pagination.
   */
  async listUsers(query: QueryUsersDto): Promise<PaginatedUsersResponseDto> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
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
        owned_store: true,
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
    const store = user.owned_store;
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
