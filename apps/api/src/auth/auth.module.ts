import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginRateLimiterService } from './services/login-rate-limiter.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, LoginRateLimiterService],
  exports: [AuthService, JwtStrategy, LoginRateLimiterService, PassportModule, JwtModule],
})
export class AuthModule {}
