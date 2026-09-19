import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CashShiftsService } from './cash-shifts.service.js';
import { CashShiftsController } from './cash-shifts.controller.js';
import { CashShift } from './entities/cash-shift.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([CashShift])],
  controllers: [CashShiftsController],
  providers: [CashShiftsService],
})
export class CashShiftsModule {}
