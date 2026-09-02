import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role, UserDetailDto } from '@ratehub/shared';

export class StoreSummaryDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id: string;

  @ApiProperty({ example: 'Apex Electronics Superstore' })
  name: string;

  @ApiProperty({ example: '100 Silicon Way, Tech District, San Francisco, CA' })
  address: string;

  @ApiPropertyOptional({ example: 4.5, nullable: true })
  averageRating: number | null;
}

export class UserDetailResponseDto implements UserDetailDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id: string;

  @ApiProperty({ example: 'Alexander Montgomery James' })
  name: string;

  @ApiProperty({ example: 'alexander@storerating.local' })
  email: string;

  @ApiProperty({ example: '123 Meadowbrook Lane, Chicago, IL' })
  address: string;

  @ApiProperty({ enum: Role, example: Role.STORE_OWNER })
  role: Role;

  @ApiPropertyOptional({
    type: StoreSummaryDto,
    description: 'Store details and computed rating (included ONLY if role is store_owner)',
  })
  store?: StoreSummaryDto | null;

  @ApiProperty({ example: '2026-09-02T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-09-02T10:00:00.000Z' })
  updatedAt: Date;
}
