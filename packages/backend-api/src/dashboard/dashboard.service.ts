import { Injectable } from '@nestjs/common';
import { DataSource, IsNull } from 'typeorm';
import { Sale } from '../sales/entities/sale.entity.js';
import { Customer } from '../customers/entities/customer.entity.js';
import { Product } from '../products/entities/product.entity.js';
import { Purchase } from '../purchases/entities/purchase.entity.js';
import { Expense } from '../expenses/entities/expense.entity.js';

@Injectable()
export class DashboardService {
  constructor(private dataSource: DataSource) {}

  async getSummary(companyId: string, period: string = 'week') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Sales today
    const salesTodayResult = await this.dataSource.manager
      .createQueryBuilder(Sale, 'sale')
      .select('SUM(sale.total)', 'total')
      .where('sale.createdAt >= :today', { today: today.toISOString() })
      .andWhere(companyId ? 'sale.companyId = :companyId' : 'sale.companyId IS NULL', { companyId })
      .getRawOne();
    
    // Sales this month
    const salesMonthResult = await this.dataSource.manager
      .createQueryBuilder(Sale, 'sale')
      .select('SUM(sale.total)', 'total')
      .where('sale.createdAt >= :firstDay', { firstDay: firstDayOfMonth.toISOString() })
      .andWhere(companyId ? 'sale.companyId = :companyId' : 'sale.companyId IS NULL', { companyId })
      .getRawOne();

    // Purchases this month (Inversión/Gastos)
    const purchasesMonthResult = await this.dataSource.manager
      .createQueryBuilder(Purchase, 'purchase')
      .select('SUM(purchase.total)', 'total')
      .where('purchase.createdAt >= :firstDay', { firstDay: firstDayOfMonth.toISOString() })
      .andWhere(companyId ? 'purchase.companyId = :companyId' : 'purchase.companyId IS NULL', { companyId })
      .getRawOne();

    // Expenses this month
    const expensesMonthResult = await this.dataSource.manager
      .createQueryBuilder(Expense, 'expense')
      .select('SUM(expense.amount)', 'total')
      .where('expense.createdAt >= :firstDay', { firstDay: firstDayOfMonth.toISOString() })
      .andWhere(companyId ? 'expense.companyId = :companyId' : 'expense.companyId IS NULL', { companyId })
      .getRawOne();

    // Profit this month (Utilidades)
    const profitMonthResult = await this.dataSource.manager.query(`
      SELECT SUM((sd."unitPrice" - sd."unitCost") * sd.quantity) as "totalProfit"
      FROM sale_details sd
      JOIN sales s ON s.id = sd."saleId"
      WHERE s."createdAt" >= $1 AND ${companyId ? 's."companyId" = $2' : 's."companyId" IS NULL'}
    `, companyId ? [firstDayOfMonth.toISOString(), companyId] : [firstDayOfMonth.toISOString()]);

    // Total Customers
    const totalCustomers = await this.dataSource.manager.count(Customer, { where: { isActive: true, companyId: companyId || IsNull() } });

    // Low stock products (<= 5)
    const lowStockProducts = await this.dataSource.manager
      .createQueryBuilder(Product, 'product')
      .where('product.stock <= 5')
      .andWhere('product.isActive = :active', { active: true })
      .andWhere(companyId ? 'product.companyId = :companyId' : 'product.companyId IS NULL', { companyId })
      .getCount();

    // Accounts Receivable (Total Debt from customers)
    const debtResult = await this.dataSource.manager
      .createQueryBuilder(Customer, 'customer')
      .select('SUM(customer.debt)', 'total')
      .where('customer.isActive = :active', { active: true })
      .andWhere(companyId ? 'customer.companyId = :companyId' : 'customer.companyId IS NULL', { companyId })
      .getRawOne();

    // Inventory Value
    const inventoryResult = await this.dataSource.manager
      .createQueryBuilder(Product, 'product')
      .select('SUM(product.stock * product."costPrice")', 'total')
      .where('product.isActive = :active', { active: true })
      .andWhere('product.stock > 0')
      .andWhere(companyId ? 'product.companyId = :companyId' : 'product.companyId IS NULL', { companyId })
      .getRawOne();

    // Chart data handling based on period
    let numDays = 7;
    if (period === 'month') numDays = 30;
    
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (numDays - 1));
    startDate.setHours(0, 0, 0, 0);

    // Fetch raw data to handle timezones in JavaScript properly
    const recentSalesChart = await this.dataSource.manager
      .createQueryBuilder(Sale, 'sale')
      .where('sale.createdAt >= :date', { date: startDate.toISOString() })
      .andWhere(companyId ? 'sale.companyId = :companyId' : 'sale.companyId IS NULL', { companyId })
      .getMany();

    const recentPurchasesChart = await this.dataSource.manager
      .createQueryBuilder(Purchase, 'purchase')
      .where('purchase.createdAt >= :date', { date: startDate.toISOString() })
      .andWhere(companyId ? 'purchase.companyId = :companyId' : 'purchase.companyId IS NULL', { companyId })
      .getMany();

    const recentExpensesChart = await this.dataSource.manager
      .createQueryBuilder(Expense, 'expense')
      .where('expense.createdAt >= :date', { date: startDate.toISOString() })
      .andWhere(companyId ? 'expense.companyId = :companyId' : 'expense.companyId IS NULL', { companyId })
      .getMany();

    // Helper to get local date string YYYY-MM-DD
    const getLocalDateString = (d: Date) => {
      const date = new Date(d);
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    // Fill missing days with 0 and calculate totals
    const chartData = [];
    for (let i = 0; i < numDays; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateStr = getLocalDateString(d);
      
      const daySales = recentSalesChart.filter(s => getLocalDateString(s.createdAt) === dateStr);
      const dayPurchases = recentPurchasesChart.filter(p => getLocalDateString(p.createdAt) === dateStr);
      const dayExpenses = recentExpensesChart.filter(e => getLocalDateString(e.createdAt) === dateStr);

      const totalVentas = daySales.reduce((acc, curr) => acc + Number(curr.total), 0);
      const totalCompras = dayPurchases.reduce((acc, curr) => acc + Number(curr.total), 0);
      const totalGastos = dayExpenses.reduce((acc, curr) => acc + Number(curr.amount), 0);
      
      // Formatear el día en español para la UI
      const dayName = d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: numDays > 7 ? 'short' : undefined });

      chartData.push({
        date: dateStr,
        name: dayName.charAt(0).toUpperCase() + dayName.slice(1),
        ventas: totalVentas,
        compras: totalCompras,
        gastos: totalGastos
      });
    }

    // Recent Sales
    const recentSales = await this.dataSource.manager.find(Sale, {
      where: { companyId: companyId || IsNull() },
      relations: ['customer'],
      order: { createdAt: 'DESC' },
      take: 5
    });

    // Recent Expenses (Pérdidas/Mermas)
    const recentExpenses = await this.dataSource.manager.find(Expense, {
      where: { companyId: companyId || IsNull() },
      order: { createdAt: 'DESC' },
      take: 5
    });

    // Top Selling Products
    const topProducts = await this.dataSource.manager.query(`
      SELECT 
        p.description as name, 
        SUM(sd.quantity) as "totalSold", 
        SUM((sd."unitPrice" - sd."unitCost") * sd.quantity) as profit 
      FROM sale_details sd
      JOIN products p ON p.id = sd."productId"
      JOIN sales s ON s.id = sd."saleId"
      WHERE ${companyId ? 's."companyId" = $1' : 's."companyId" IS NULL'}
      GROUP BY p.id, p.description
      ORDER BY "totalSold" DESC
      LIMIT 5
    `, companyId ? [companyId] : []);

    return {
      todayTotal: parseFloat(salesTodayResult?.total || 0),
      monthTotal: parseFloat(salesMonthResult?.total || 0),
      monthPurchases: parseFloat(purchasesMonthResult?.total || 0),
      monthExpenses: parseFloat(expensesMonthResult?.total || 0),
      monthProfit: parseFloat(profitMonthResult?.[0]?.totalProfit || 0),
      totalCustomers,
      lowStockProducts,
      accountsReceivable: parseFloat(debtResult?.total || 0),
      inventoryValue: parseFloat(inventoryResult?.total || 0),
      chartData,
      recentSales,
      recentExpenses,
      topProducts: topProducts.map((p: any) => ({
        name: p.name,
        totalSold: Number(p.totalSold),
        profit: Number(p.profit)
      }))
    };
  }
}
