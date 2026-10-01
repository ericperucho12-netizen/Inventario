import { Controller, Get, UseGuards, Query, Request, Post } from '@nestjs/common';
import { DashboardService } from './dashboard.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { DataSource } from 'typeorm';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private dataSource: DataSource
  ) {}

  @Post('migrate-data')
  async migrateData(@Request() req: any) {
    const compId = req.user.companyId;
    if (!compId) return { error: 'No companyId' };
    
    const tables = ['sales', 'purchases', 'cash_shifts', 'products', 'expenses', 'customers', 'suppliers', 'categories'];
    let totalUpdated = 0;
    
    for (const table of tables) {
      try {
        await this.dataSource.query(`UPDATE ${table} SET "companyId" = $1 WHERE "companyId" IS NULL`, [compId]);
        totalUpdated++;
      } catch (e) {
        try {
          await this.dataSource.query(`UPDATE ${table} SET companyId = ? WHERE companyId IS NULL`, [compId]);
          totalUpdated++;
        } catch (e2) {}
      }
    }
    
    return { success: true, message: `Migrated legacy data for ${totalUpdated} tables` };
  }

  @Get('summary')
  getSummary(@Query('period') period: string, @Request() req: any) {
    return this.dashboardService.getSummary(req.user.companyId, period);
  }
}
