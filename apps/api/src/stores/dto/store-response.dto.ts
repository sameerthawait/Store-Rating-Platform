import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StoreDto } from '@ratehub/shared';
import { UserResponseDto } from '../../auth/dto/user-response.dto';

export class StoreResponseDto implements StoreDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id: string;

  @ApiProperty({ example: 'Apex Electronics Superstore' })
  name: string;

  @ApiProperty({ example: 'contact@apexelectronics.com' })
  email: string;

  @ApiProperty({ example: '100 Silicon Way, Tech District, San Francisco, CA' })
  address: string;

  @ApiPropertyOptional({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6', nullable: true })
  ownerId: string | null;

  @ApiPropertyOptional({ example: null, nullable: true })
  averageRating: number | null;

  @ApiPropertyOptional({ example: null, nullable: true })
  userRating?: number | null;

  @ApiPropertyOptional({ type: () => UserResponseDto, nullable: true })
  owner?: UserResponseDto | null;

  @ApiProperty({ example: '2026-09-02T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-09-02T10:00:00.000Z' })
  updatedAt: Date;
}
