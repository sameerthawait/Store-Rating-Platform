import { Controller, Get, HttpCode, HttpStatus, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PaginatedUserStoresResponseDto } from './dto/paginated-user-stores-response.dto';
import { SearchStoresQueryDto } from './dto/search-stores-query.dto';
import { StoresService } from './stores.service';

@ApiTags('Stores / Discovery')
@Controller('stores')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StoresPublicController {
  constructor(private readonly storesService: StoresService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'List stores with overall average rating and user own rating (Accessible to all authenticated users)',
  })
  @ApiOkResponse({
    description: 'Stores successfully retrieved with overall and user-specific ratings',
    type: PaginatedUserStoresResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized: Authentication token is missing or expired',
  })
  async listStores(
    @CurrentUser('id') userId: string,
    @Query() query: SearchStoresQueryDto,
  ): Promise<PaginatedUserStoresResponseDto> {
    return this.storesService.listStoresForUser(userId, query);
  }
}
