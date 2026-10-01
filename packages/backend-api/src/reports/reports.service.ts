import { Injectable } from '@nestjs/common';
import { DataSource, IsNull } from 'typeorm';
import { Sale } from '../sales/entities/sale.entity.js';
import { SaleDetail } from '../sales/entities/sale-detail.entity.js';

@Injectable()
export class ReportsService {
  constructor(private dataSource: DataSource) {}

  async getReport(startDate: string, endDate: string, companyId: string) {
    // Obtener todas las ventas en el periodo
    const sales = await this.dataSource.manager.find(Sale, {
      where: {
        companyId: companyId || IsNull()
      },
      relations: ['customer', 'details', 'details.product']
    });

    // Filtro manual seguro para fechas tomando en cuenta la zona horaria de México
    const filteredSales = sales.filter(s => {
      const mxString = new Date(s.createdAt).toLocaleString("en-US", { timeZone: "America/Mexico_City", year: "numeric", month: "2-digit", day: "2-digit" });
      const [mm, dd, yyyy] = mxString.split('/');
      const saleDateStr = `${yyyy}-${mm}-${dd}`;
      return saleDateStr >= startDate && saleDateStr <= endDate;
    });

    let totalRevenue = 0;
    let totalCost = 0;

    const productSalesMap = new Map<string, { name: string; quantity: number; revenue: number; cost: number }>();

    const rawTickets = [];

    for (const sale of filteredSales) {
      if (sale.status === 'COMPLETED') {
        totalRevenue += Number(sale.total);
        
        let saleCost = 0;
        
        const ticketInfo = {
          id: sale.id,
          date: sale.createdAt,
          customer: sale.customer ? sale.customer.name : 'Público en General',
          total: Number(sale.total),
          status: sale.status,
          isCredit: sale.isCredit,
          cost: 0,
          profit: 0
        };

        for (const detail of sale.details) {
          const qty = Number(detail.quantity);
          const price = Number(detail.unitPrice);
          const pCost = Number(detail.unitCost || 0);
          
          const lineRevenue = qty * price;
          const lineCost = qty * pCost;
          
          saleCost += lineCost;
          totalCost += lineCost;

          // Mapa de top productos
          if (detail.product) {
            const existing = productSalesMap.get(detail.product.id);
            if (existing) {
              existing.quantity += qty;
              existing.revenue += lineRevenue;
              existing.cost += lineCost;
            } else {
              productSalesMap.set(detail.product.id, {
                name: detail.product.description,
                quantity: qty,
                revenue: lineRevenue,
                cost: lineCost
              });
            }
          }
        }
        
        ticketInfo.cost = saleCost;
        ticketInfo.profit = ticketInfo.total - saleCost;
        rawTickets.push(ticketInfo);
      }
    }

    const netProfit = totalRevenue - totalCost;

    // Calcular top 10 productos
    const topProducts = Array.from(productSalesMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    return {
      summary: {
        totalRevenue,
        totalCost,
        netProfit,
        salesCount: filteredSales.filter(s => s.status === 'COMPLETED').length
      },
      topProducts,
      rawTickets
    };
  }
}
