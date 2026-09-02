import { ApiProperty } from '@nestjs/swagger';
import { StoreResponseDto } from './store-response.dto';

export class PaginatedStoresResponseDto {
  @ApiProperty({ type: [StoreResponseDto] })
  data: StoreResponseDto[];

  @ApiProperty({ example: 45 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 5 })
  totalPages: number;
}
