import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserStoreItemDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id: string;

  @ApiProperty({ example: 'Artisan Coffee Roasters' })
  name: string;

  @ApiProperty({ example: '250 Roast Lane, Seattle, WA' })
  address: string;

  @ApiPropertyOptional({
    description: 'Overall average rating across all users (null if 0 ratings)',
    example: 4.5,
    nullable: true,
  })
  overallRating: number | null;

  @ApiPropertyOptional({
    description: "The authenticated caller's own submitted rating for this store (null if not yet rated)",
    example: 5,
    nullable: true,
  })
  myRating: number | null;
}
