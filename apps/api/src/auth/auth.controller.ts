import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { SignupDto } from './dto/signup.dto';
import { UserResponseDto } from './dto/user-response.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Self-register a new Normal User account' })
  @ApiCreatedResponse({
    description: 'User successfully registered',
    type: UserResponseDto,
  })
  @ApiConflictResponse({
    description: 'An account with this email already exists',
  })
  async signup(@Body() dto: SignupDto): Promise<UserResponseDto> {
    return this.authService.signup(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user with email and password' })
  @ApiOkResponse({
    description: 'User successfully authenticated, access and refresh tokens returned',
    type: LoginResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid email or password (deliberately vague)',
  })
  async login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange a valid refresh token for a new token pair (rotation)' })
  @ApiOkResponse({
    description: 'Tokens successfully refreshed and rotated',
    type: LoginResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid, revoked, or expired refresh token',
  })
  async refresh(@Body() dto: RefreshTokenDto): Promise<LoginResponseDto> {
    return this.authService.refreshTokens(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke active refresh token and log out current user' })
  @ApiOkResponse({
    description: 'User successfully logged out and session revoked',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication token missing or invalid',
  })
  async logout(@CurrentUser('id') userId: string): Promise<{ message: string }> {
    return this.authService.logout(userId);
  }

  @Patch('change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password for authenticated user and revoke all other sessions' })
  @ApiOkResponse({
    description: 'Password successfully changed and all active sessions revoked',
  })
  @ApiUnauthorizedResponse({
    description: 'Current password incorrect or unauthenticated',
  })
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    return this.authService.changePassword(userId, dto);
  }
}
