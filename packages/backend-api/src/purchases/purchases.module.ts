import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchasesService } from './purchases.service.js';
import { PurchasesController } from './purchases.controller.js';
import { Purchase } from './entities/purchase.entity.js';
import { PurchaseDetail } from './entities/purchase-detail.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Purchase, PurchaseDetail])],
  controllers: [PurchasesController],
  providers: [PurchasesService],
})
export class PurchasesModule {}
