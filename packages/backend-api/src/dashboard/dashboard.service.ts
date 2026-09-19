import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Sale } from '../sales/entities/sale.entity.js';
import { Customer } from '../customers/entities/customer.entity.js';
import { Product } from '../products/entities/product.entity.js';

@Injectable()
export class DashboardService {
  constructor(private dataSource: DataSource) {}

  async getSummary() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Sales today
    const salesTodayResult = await this.dataSource.manager
      .createQueryBuilder(Sale, 'sale')
      .select('SUM(sale.total)', 'total')
      .where('sale.createdAt >= :today', { today: today.toISOString() })
      .getRawOne();
    
    // Sales this month
    const salesMonthResult = await this.dataSource.manager
      .createQueryBuilder(Sale, 'sale')
      .select('SUM(sale.total)', 'total')
      .where('sale.createdAt >= :firstDay', { firstDay: firstDayOfMonth.toISOString() })
      .getRawOne();

    // Total Customers
    const totalCustomers = await this.dataSource.manager.count(Customer);

    // Low stock products (<= 5)
    const lowStockProducts = await this.dataSource.manager
      .createQueryBuilder(Product, 'product')
      .where('product.stock <= 5')
      .andWhere('product.isActive = :active', { active: true })
      .getCount();

    // Last 7 days sales chart data
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const chartDataResult = await this.dataSource.manager
      .createQueryBuilder(Sale, 'sale')
      .select('date(sale.createdAt)', 'date')
      .addSelect('SUM(sale.total)', 'total')
      .where('sale.createdAt >= :date', { date: sevenDaysAgo.toISOString() })
      .groupBy('date(sale.createdAt)')
      .orderBy('date', 'ASC')
      .getRawMany();

    // Fill missing days with 0
    const chartData = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const found = chartDataResult.find(item => item.date === dateStr);
      
      // Formatear el día en español para la UI
      const dayName = d.toLocaleDateString('es-MX', { weekday: 'short' });

      chartData.push({
        date: dateStr,
        name: dayName.charAt(0).toUpperCase() + dayName.slice(1),
        total: found ? parseFloat(found.total) : 0
      });
    }

    // Recent Sales
    const recentSales = await this.dataSource.manager.find(Sale, {
      relations: ['customer'],
      order: { createdAt: 'DESC' },
      take: 5
    });

    return {
      todayTotal: parseFloat(salesTodayResult?.total || 0),
      monthTotal: parseFloat(salesMonthResult?.total || 0),
      totalCustomers,
      lowStockProducts,
      chartData,
      recentSales
    };
  }
}
