import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Role } from '@ratehub/shared';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateStoreDto } from './dto/create-store.dto';
import { PaginatedStoresResponseDto } from './dto/paginated-stores-response.dto';
import { QueryStoresDto } from './dto/query-stores.dto';
import { StoreResponseDto } from './dto/store-response.dto';
import { StoresService } from './stores.service';

@ApiTags('Admin / Stores')
@Controller('admin/stores')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, 'admin')
@ApiBearerAuth()
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Provision a new Store and assign/create Store Owner (Admin only)' })
  @ApiCreatedResponse({
    description: 'Store successfully created and owner assigned inside transaction',
    type: StoreResponseDto,
  })
  @ApiConflictResponse({
    description: 'Store or owner email already exists',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden: Caller is not an Administrator',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized: Authentication token is missing or expired',
  })
  async createStore(@Body() dto: CreateStoreDto): Promise<StoreResponseDto> {
    return this.storesService.createStore(dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'List stores with pagination, sorting (by name/email/address/rating), and filtering (Admin only)',
  })
  @ApiOkResponse({
    description: 'Paginated store list successfully retrieved with computed average ratings',
    type: PaginatedStoresResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Forbidden: Caller is not an Administrator',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized: Authentication token is missing or expired',
  })
  async listStores(@Query() query: QueryStoresDto): Promise<PaginatedStoresResponseDto> {
    return this.storesService.listStores(query);
  }
}
