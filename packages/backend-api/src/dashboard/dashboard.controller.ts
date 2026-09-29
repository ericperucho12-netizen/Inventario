import { Controller, Get, UseGuards, Query, Request } from '@nestjs/common';
import { DashboardService } from './dashboard.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  getSummary(@Query('period') period: string, @Request() req: any) {
    return this.dashboardService.getSummary(req.user.companyId, period);
  }
}
