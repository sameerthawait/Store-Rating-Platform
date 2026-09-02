import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  StoreOwnerDashboardResponseDto,
  StoreRaterResponseDto,
} from './dto/store-owner-dashboard-response.dto';

@Injectable()
export class StoreOwnerService {
  private readonly logger = new Logger(StoreOwnerService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves dashboard analytics and raters for the authenticated Store Owner.
   * Resolves store directly from ownerId (JWT user.id), eliminating parameter tampering.
   */
  async getDashboard(ownerId: string): Promise<StoreOwnerDashboardResponseDto> {
    // 1. Resolve store owned by this authenticated user
    const store = await this.prisma.store.findFirst({
      where: { owner_id: ownerId },
    });

    if (!store) {
      throw new NotFoundException(
        'No store is currently assigned to your account — please contact an administrator',
      );
    }

    // 2. Fetch rating aggregations and raters in parallel
    const [ratingAgg, ratings] = await Promise.all([
      this.prisma.rating.aggregate({
        where: { store_id: store.id },
        _avg: { rating: true },
        _count: { rating: true },
      }),
      this.prisma.rating.findMany({
        where: { store_id: store.id },
        orderBy: { created_at: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
    ]);

    const averageRating =
      ratingAgg._avg.rating !== null
        ? Number(ratingAgg._avg.rating.toFixed(1))
        : null;

    const raters: StoreRaterResponseDto[] = ratings.map((r) => ({
      userId: r.user.id,
      name: r.user.name,
      rating: r.rating,
      submittedAt: r.created_at,
    }));

    return {
      store: {
        id: store.id,
        name: store.name,
        email: store.email,
        address: store.address,
      },
      averageRating,
      totalRatings: ratingAgg._count.rating,
      raters,
    };
  }
}
