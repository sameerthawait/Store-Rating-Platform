import { Controller, Get, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Role } from '@ratehub/shared';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { StoreOwnerDashboardResponseDto } from './dto/store-owner-dashboard-response.dto';
import { StoreOwnerService } from './store-owner.service';

@ApiTags('Store Owner / Dashboard')
@Controller('store-owner')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.STORE_OWNER, 'store_owner')
@ApiBearerAuth()
export class StoreOwnerController {
  constructor(private readonly storeOwnerService: StoreOwnerService) {}

  @Get('dashboard')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Retrieve store metrics and raters list for the authenticated Store Owner (Store Owner only)',
  })
  @ApiOkResponse({
    description: 'Store dashboard metrics and raters successfully retrieved',
    type: StoreOwnerDashboardResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'No store currently assigned to this account',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden: Caller is not a Store Owner',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized: Authentication token is missing or expired',
  })
  async getDashboard(
    @CurrentUser('id') userId: string,
  ): Promise<StoreOwnerDashboardResponseDto> {
    return this.storeOwnerService.getDashboard(userId);
  }
}
