import { Module } from '@nestjs/common';
import { StoresPublicController } from './stores-public.controller';
import { StoresController } from './stores.controller';
import { StoresService } from './stores.service';

@Module({
  controllers: [StoresController, StoresPublicController],
  providers: [StoresService],
  exports: [StoresService],
})
export class StoresModule {}
