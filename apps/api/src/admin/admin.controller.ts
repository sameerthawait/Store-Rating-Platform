import { Controller, Get, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
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
import { AdminService } from './admin.service';
import { AdminDashboardResponseDto } from './dto/admin-dashboard-response.dto';

@ApiTags('Admin / Platform')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, 'admin')
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retrieve platform-wide aggregate counts (Admin only)' })
  @ApiOkResponse({
    description: 'Platform metrics successfully retrieved',
    type: AdminDashboardResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Forbidden: Caller is not an Administrator',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized: Authentication token is missing or expired',
  })
  async getDashboardMetrics(): Promise<AdminDashboardResponseDto> {
    return this.adminService.getDashboardMetrics();
  }
}
