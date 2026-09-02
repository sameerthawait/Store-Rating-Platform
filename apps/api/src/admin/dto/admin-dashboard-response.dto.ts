import { ApiProperty } from '@nestjs/swagger';

export class AdminDashboardResponseDto {
  @ApiProperty({
    description: 'Total registered user count (all roles)',
    example: 150,
  })
  totalUsers: number;

  @ApiProperty({
    description: 'Total registered stores count',
    example: 45,
  })
  totalStores: number;

  @ApiProperty({
    description: 'Total ratings submitted across all stores',
    example: 820,
  })
  totalRatings: number;
}
