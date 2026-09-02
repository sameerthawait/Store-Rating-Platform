import { ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@ratehub/shared';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UserFilterDto {
  @ApiPropertyOptional({ description: 'Filter by name (case-insensitive contains)' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Filter by email (case-insensitive contains)' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: 'Filter by address (case-insensitive contains)' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ enum: Role, description: 'Filter by exact role' })
  @IsOptional()
  @IsIn([Role.ADMIN, Role.NORMAL, Role.STORE_OWNER, 'admin', 'normal', 'store_owner'])
  role?: Role | 'admin' | 'normal' | 'store_owner';
}

export class QueryUsersDto {
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
    enum: ['name', 'email', 'address', 'role', 'created_at', 'createdAt'],
    description: 'Sort field',
  })
  @IsOptional()
  @IsString()
  @IsIn(['name', 'email', 'address', 'role', 'created_at', 'createdAt', 'updated_at', 'updatedAt'])
  sort?: string = 'created_at';

  @ApiPropertyOptional({ default: 'desc', enum: ['asc', 'desc', 'ASC', 'DESC'], description: 'Sort direction' })
  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc', 'ASC', 'DESC'])
  order?: 'asc' | 'desc' | 'ASC' | 'DESC' = 'desc';

  // Direct query parameters
  @ApiPropertyOptional({ description: 'Filter by name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Filter by email' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: 'Filter by address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ enum: Role, description: 'Filter by role' })
  @IsOptional()
  @IsIn([Role.ADMIN, Role.NORMAL, Role.STORE_OWNER, 'admin', 'normal', 'store_owner'])
  role?: Role | 'admin' | 'normal' | 'store_owner';

  // Nested filter parameter (?filter[name]=...)
  @ApiPropertyOptional({ type: UserFilterDto, description: 'Nested filters object' })
  @IsOptional()
  filter?: UserFilterDto;
}
