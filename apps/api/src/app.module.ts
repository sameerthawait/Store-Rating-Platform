import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import configuration from './config/configuration';
import { configValidationSchema } from './config/validation.schema';
import { PrismaModule } from './prisma/prisma.module';
import { RatingsModule } from './ratings/ratings.module';
import { StoreOwnerModule } from './store-owner/store-owner.module';
import { StoresModule } from './stores/stores.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: configValidationSchema,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    StoresModule,
    AdminModule,
    RatingsModule,
    StoreOwnerModule,
  ],
})
export class AppModule {}
