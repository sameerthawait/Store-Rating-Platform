import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Role } from '@ratehub/shared';
import { UserResponseDto } from '../auth/dto/user-response.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { PaginatedUsersResponseDto } from './dto/paginated-users-response.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { UserDetailResponseDto } from './dto/user-detail-response.dto';
import { UsersService } from './users.service';

@ApiTags('Admin / Users')
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, 'admin')
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Provision a new Normal or Admin user (Admin only)' })
  @ApiCreatedResponse({
    description: 'User successfully created by admin',
    type: UserResponseDto,
  })
  @ApiConflictResponse({
    description: 'This email is already registered',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden: Caller is not a System Administrator',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized: Authentication token is missing or expired',
  })
  async createUser(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.createUser(dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List users with pagination, sorting, and filtering (Admin only)' })
  @ApiOkResponse({
    description: 'Paginated user list successfully retrieved',
    type: PaginatedUsersResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Forbidden: Caller is not a System Administrator',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized: Authentication token is missing or expired',
  })
  async listUsers(@Query() query: QueryUsersDto): Promise<PaginatedUsersResponseDto> {
    return this.usersService.listUsers(query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Retrieve full details for a user (includes store average rating for Store Owners) (Admin only)',
  })
  @ApiOkResponse({
    description: 'User details successfully retrieved',
    type: UserDetailResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden: Caller is not a System Administrator',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized: Authentication token is missing or expired',
  })
  async getUserById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<UserDetailResponseDto> {
    return this.usersService.getUserById(id);
  }
}
