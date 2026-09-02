import { ApiProperty } from '@nestjs/swagger';
import { UserStoreItemDto } from './user-store-item.dto';

export class PaginatedUserStoresResponseDto {
  @ApiProperty({ type: [UserStoreItemDto] })
  data: UserStoreItemDto[];

  @ApiProperty({ example: 45 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 3 })
  totalPages: number;
}
