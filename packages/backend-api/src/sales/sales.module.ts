import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesService } from './sales.service.js';
import { SalesController } from './sales.controller.js';
import { Sale } from './entities/sale.entity.js';
import { SaleDetail } from './entities/sale-detail.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Sale, SaleDetail])],
  controllers: [SalesController],
  providers: [SalesService],
})
export class SalesModule {}
