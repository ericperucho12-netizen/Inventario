import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { CashShiftsService } from './cash-shifts.service.js';
import { CreateCashShiftDto } from './dto/create-cash-shift.dto.js';
import { CloseCashShiftDto } from './dto/update-cash-shift.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@UseGuards(JwtAuthGuard)
@Controller('cash-shifts')
export class CashShiftsController {
  constructor(private readonly cashShiftsService: CashShiftsService) {}

  @Post('open')
  open(@Body() createCashShiftDto: CreateCashShiftDto, @Request() req: any) {
    return this.cashShiftsService.open(createCashShiftDto, req.user.userId);
  }

  @Post('close')
  close(@Body() closeCashShiftDto: CloseCashShiftDto, @Request() req: any) {
    return this.cashShiftsService.close(closeCashShiftDto, req.user.userId);
  }

  @Get('current')
  getCurrent() {
    return this.cashShiftsService.getCurrent();
  }

  @Get('metrics')
  getMetrics() {
    return this.cashShiftsService.getMetrics();
  }
}
