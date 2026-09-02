import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RatingResponseDto } from './dto/rating-response.dto';
import { SubmitRatingDto } from './dto/submit-rating.dto';

@Injectable()
export class RatingsService {
  private readonly logger = new Logger(RatingsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Submits or updates a star rating for a store.
   * Performs an atomic database upsert relying on @@unique([user_id, store_id]) constraint.
   */
  async submitRating(userId: string, dto: SubmitRatingDto): Promise<RatingResponseDto> {
    // 1. Verify store existence
    const store = await this.prisma.store.findUnique({
      where: { id: dto.storeId },
      select: { id: true },
    });

    if (!store) {
      throw new NotFoundException('This store is no longer available');
    }

    // 2. Perform atomic upsert (race-condition free)
    const ratingRecord = await this.prisma.rating.upsert({
      where: {
        user_id_store_id: {
          user_id: userId,
          store_id: dto.storeId,
        },
      },
      create: {
        user_id: userId,
        store_id: dto.storeId,
        rating: dto.rating,
      },
      update: {
        rating: dto.rating,
      },
    });

    return {
      id: ratingRecord.id,
      userId: ratingRecord.user_id,
      storeId: ratingRecord.store_id,
      rating: ratingRecord.rating,
      createdAt: ratingRecord.created_at,
      updatedAt: ratingRecord.updated_at,
    };
  }
}
