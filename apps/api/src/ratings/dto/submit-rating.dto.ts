import { ApiProperty } from '@nestjs/swagger';
import { RATING_VALIDATION } from '@ratehub/shared';
import { IsInt, IsNotEmpty, IsUUID, Max, Min } from 'class-validator';

export class SubmitRatingDto {
  @ApiProperty({
    description: 'Target Store UUID',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  @IsUUID('4', { message: 'Store ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Store ID is required' })
  storeId: string;

  @ApiProperty({
    description: 'Star rating value (1 to 5)',
    example: 5,
    minimum: RATING_VALIDATION.MIN,
    maximum: RATING_VALIDATION.MAX,
  })
  @IsInt({ message: 'Rating must be an integer' })
  @Min(RATING_VALIDATION.MIN, {
    message: `Rating must be at least ${RATING_VALIDATION.MIN}`,
  })
  @Max(RATING_VALIDATION.MAX, {
    message: `Rating must not exceed ${RATING_VALIDATION.MAX}`,
  })
  rating: number;
}
