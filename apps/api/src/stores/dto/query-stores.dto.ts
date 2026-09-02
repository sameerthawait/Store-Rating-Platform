import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class StoreFilterDto {
  @ApiPropertyOptional({ description: 'Filter by store name (case-insensitive contains)' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Filter by store email (case-insensitive contains)' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: 'Filter by store address (case-insensitive contains)' })
  @IsOptional()
  @IsString()
  address?: string;
}

export class QueryStoresDto {
  @ApiPropertyOptional({ default: 1, minimum: 1, description: 'Page number' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 100, description: 'Items per page' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    default: 'created_at',
    enum: ['name', 'email', 'address', 'rating', 'created_at', 'createdAt'],
    description: 'Sort field (including computed average rating)',
  })
  @IsOptional()
  @IsString()
  @IsIn(['name', 'email', 'address', 'rating', 'created_at', 'createdAt', 'updated_at', 'updatedAt'])
  sort?: string = 'created_at';

  @ApiPropertyOptional({ default: 'desc', enum: ['asc', 'desc', 'ASC', 'DESC'], description: 'Sort direction' })
  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc', 'ASC', 'DESC'])
  order?: 'asc' | 'desc' | 'ASC' | 'DESC' = 'desc';

  // Direct query parameters
  @ApiPropertyOptional({ description: 'Filter by store name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Filter by store email' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: 'Filter by store address' })
  @IsOptional()
  @IsString()
  address?: string;

  // Nested filter parameter (?filter[name]=...)
  @ApiPropertyOptional({ type: StoreFilterDto, description: 'Nested filters object' })
  @IsOptional()
  filter?: StoreFilterDto;
}
