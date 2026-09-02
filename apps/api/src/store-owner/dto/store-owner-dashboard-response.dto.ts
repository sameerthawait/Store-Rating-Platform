import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StoreRaterDto } from '@ratehub/shared';

export class StoreRaterResponseDto implements StoreRaterDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  userId: string;

  @ApiProperty({ example: 'Charlotte Davis Shopper' })
  name: string;

  @ApiProperty({ example: 5 })
  rating: number;

  @ApiProperty({ example: '2026-09-02T10:00:00.000Z' })
  submittedAt: Date;
}

export class StoreOverviewDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id: string;

  @ApiProperty({ example: 'Apex Electronics Superstore' })
  name: string;

  @ApiProperty({ example: 'contact@apexelectronics.com' })
  email: string;

  @ApiProperty({ example: '100 Silicon Way, Tech District, San Francisco, CA' })
  address: string;
}

export class StoreOwnerDashboardResponseDto {
  @ApiProperty({ type: StoreOverviewDto })
  store: StoreOverviewDto;

  @ApiPropertyOptional({
    description: 'Computed overall average rating across all raters (null if 0 ratings)',
    example: 4.6,
    nullable: true,
  })
  averageRating: number | null;

  @ApiProperty({ example: 25, description: 'Total number of ratings submitted' })
  totalRatings: number;

  @ApiProperty({
    type: [StoreRaterResponseDto],
    description: 'List of users who rated this store and their submitted star rating',
  })
  raters: StoreRaterResponseDto[];
}
