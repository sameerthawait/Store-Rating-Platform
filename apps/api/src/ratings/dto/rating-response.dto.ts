import { ApiProperty } from '@nestjs/swagger';
import { RatingDto } from '@ratehub/shared';

export class RatingResponseDto implements RatingDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id: string;

  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  userId: string;

  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  storeId: string;

  @ApiProperty({ example: 5 })
  rating: number;

  @ApiProperty({ example: '2026-09-02T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-09-02T10:00:00.000Z' })
  updatedAt: Date;
}
