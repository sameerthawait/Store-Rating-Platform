import { Module } from '@nestjs/common';
import { StoreOwnerController } from './store-owner.controller';
import { StoreOwnerService } from './store-owner.service';

@Module({
  controllers: [StoreOwnerController],
  providers: [StoreOwnerService],
  exports: [StoreOwnerService],
})
export class StoreOwnerModule {}
