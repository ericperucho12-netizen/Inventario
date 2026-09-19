import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateCashShiftDto } from './dto/create-cash-shift.dto.js';
import { CloseCashShiftDto } from './dto/update-cash-shift.dto.js';
import { DataSource } from 'typeorm';
import { CashShift } from './entities/cash-shift.entity.js';
import { Sale } from '../sales/entities/sale.entity.js';

@Injectable()
export class CashShiftsService {
  constructor(private dataSource: DataSource) {}

  async open(createCashShiftDto: CreateCashShiftDto, userId: string) {
    const current = await this.getCurrent();
    if (current) {
      throw new BadRequestException('Ya existe un turno de caja abierto');
    }

    const shift = new CashShift();
    shift.initialAmount = createCashShiftDto.initialAmount;
    shift.userId = userId;
    
    return this.dataSource.manager.save(shift);
  }

  async close(closeCashShiftDto: CloseCashShiftDto, userId: string) {
    const current = await this.getCurrent();
    if (!current) {
      throw new BadRequestException('No hay ninguna caja abierta para cerrar');
    }

    // Calcular suma de ventas del turno
    const sales = await this.dataSource.manager.find(Sale, {
      where: { cashShiftId: current.id }
    });

    const totalSales = sales.reduce((acc, sale) => acc + Number(sale.total), 0);
    const systemAmount = Number(current.initialAmount) + totalSales;

    current.declaredAmount = closeCashShiftDto.declaredAmount;
    current.systemAmount = systemAmount;
    current.status = 'CLOSED';
    current.closedAt = new Date();

    return this.dataSource.manager.save(current);
  }

  async getCurrent() {
    return this.dataSource.manager.findOne(CashShift, {
      where: { status: 'OPEN' }
    });
  }

  async getMetrics() {
    const current = await this.getCurrent();
    if (!current) {
      return { status: 'CLOSED', salesTotal: 0, salesCount: 0 };
    }

    const sales = await this.dataSource.manager.find(Sale, {
      where: { cashShiftId: current.id }
    });

    const salesTotal = sales.reduce((acc, sale) => acc + Number(sale.total), 0);
    
    return {
      status: 'OPEN',
      shift: current,
      salesTotal,
      salesCount: sales.length
    };
  }
}
