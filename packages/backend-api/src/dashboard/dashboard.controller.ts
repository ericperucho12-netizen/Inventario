import { Controller, Get, UseGuards, Query, Request, Post, Delete } from '@nestjs/common';
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

  @Delete('wipe-data')
  async wipeData(@Request() req: any) {
    const compId = req.user.companyId;
    if (!compId) return { error: 'No companyId' };
    
    // Wipe transactional data only (sales, expenses, cash_shifts, purchases)
    // We must respect foreign key constraints.
    try {
      await this.dataSource.query(`DELETE FROM sale_details WHERE "saleId" IN (SELECT id FROM sales WHERE "companyId" = $1)`, [compId]);
      await this.dataSource.query(`DELETE FROM sales WHERE "companyId" = $1`, [compId]);
      
      await this.dataSource.query(`DELETE FROM purchase_details WHERE "purchaseId" IN (SELECT id FROM purchases WHERE "companyId" = $1)`, [compId]);
      await this.dataSource.query(`DELETE FROM purchases WHERE "companyId" = $1`, [compId]);
      
      await this.dataSource.query(`DELETE FROM expenses WHERE "companyId" = $1`, [compId]);
      await this.dataSource.query(`DELETE FROM cash_shifts WHERE "companyId" = $1`, [compId]);
      
      // Optionally reset customer debt
      await this.dataSource.query(`UPDATE customers SET debt = 0 WHERE "companyId" = $1`, [compId]);
      
      return { success: true, message: 'Datos de prueba eliminados correctamente' };
    } catch (e) {
      console.error(e);
      return { error: 'No se pudieron limpiar los datos' };
    }
  }

  @Get('summary')
  getSummary(@Query('period') period: string, @Request() req: any) {
    return this.dashboardService.getSummary(req.user.companyId, period);
  }
}
