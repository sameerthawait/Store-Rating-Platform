import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PrismaService } from '../../src/prisma/prisma.service';
import { SubmitRatingDto } from '../../src/ratings/dto/submit-rating.dto';
import { RatingsService } from '../../src/ratings/ratings.service';

describe('Submit/Modify Rating - RatingsService & SubmitRatingDto', () => {
  let ratingsService: RatingsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    store: {
      findUnique: jest.fn(),
    },
    rating: {
      upsert: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RatingsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    ratingsService = module.get<RatingsService>(RatingsService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  const validStoreId = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
  const validUserId = 'user-uuid-1111';

  describe('SubmitRatingDto Validation Boundaries', () => {
    const createDto = (data: Partial<SubmitRatingDto>) => {
      return plainToInstance(SubmitRatingDto, {
        storeId: validStoreId,
        rating: 5,
        ...data,
      });
    };

    it('should PASS on valid rating values from 1 to 5', async () => {
      for (let r = 1; r <= 5; r++) {
        const dto = createDto({ rating: r });
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      }
    });

    it('should FAIL when rating is less than 1', async () => {
      const dto = createDto({ rating: 0 });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'rating')).toBe(true);
    });

    it('should FAIL when rating is greater than 5', async () => {
      const dto = createDto({ rating: 6 });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'rating')).toBe(true);
    });

    it('should FAIL when rating is a decimal float', async () => {
      const dto = createDto({ rating: 4.5 });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'rating')).toBe(true);
    });

    it('should FAIL when storeId is not a valid UUID', async () => {
      const dto = createDto({ storeId: 'invalid-store-uuid' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'storeId')).toBe(true);
    });
  });

  describe('RatingsService.submitRating() - Atomic Upsert Execution', () => {
    it('should successfully submit a new rating row via atomic upsert', async () => {
      mockPrismaService.store.findUnique.mockResolvedValue({ id: validStoreId });
      mockPrismaService.rating.upsert.mockResolvedValue({
        id: 'rating-uuid-1',
        user_id: validUserId,
        store_id: validStoreId,
        rating: 5,
        created_at: new Date('2026-09-02T10:00:00Z'),
        updated_at: new Date('2026-09-02T10:00:00Z'),
      });

      const dto: SubmitRatingDto = { storeId: validStoreId, rating: 5 };
      const result = await ratingsService.submitRating(validUserId, dto);

      expect(mockPrismaService.store.findUnique).toHaveBeenCalledWith({
        where: { id: validStoreId },
        select: { id: true },
      });

      // Verify atomic upsert target
      expect(mockPrismaService.rating.upsert).toHaveBeenCalledWith({
        where: {
          user_id_store_id: {
            user_id: validUserId,
            store_id: validStoreId,
          },
        },
        create: {
          user_id: validUserId,
          store_id: validStoreId,
          rating: 5,
        },
        update: {
          rating: 5,
        },
      });

      expect(result).toEqual({
        id: 'rating-uuid-1',
        userId: validUserId,
        storeId: validStoreId,
        rating: 5,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it('should modify an existing rating row cleanly without duplicate rows', async () => {
      mockPrismaService.store.findUnique.mockResolvedValue({ id: validStoreId });
      mockPrismaService.rating.upsert.mockResolvedValue({
        id: 'rating-uuid-1',
        user_id: validUserId,
        store_id: validStoreId,
        rating: 3, // Updated from 5 to 3
        created_at: new Date('2026-09-02T10:00:00Z'),
        updated_at: new Date('2026-09-02T10:15:00Z'),
      });

      const dto: SubmitRatingDto = { storeId: validStoreId, rating: 3 };
      const result = await ratingsService.submitRating(validUserId, dto);

      expect(result.rating).toBe(3);
      expect(mockPrismaService.rating.upsert).toHaveBeenCalledTimes(1);
    });

    it('should throw 404 NotFoundException if store does not exist', async () => {
      mockPrismaService.store.findUnique.mockResolvedValue(null);

      const dto: SubmitRatingDto = { storeId: validStoreId, rating: 4 };

      await expect(ratingsService.submitRating(validUserId, dto)).rejects.toThrow(
        new NotFoundException('This store is no longer available'),
      );

      expect(mockPrismaService.rating.upsert).not.toHaveBeenCalled();
    });
  });
});
