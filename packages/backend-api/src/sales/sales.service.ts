import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateSaleDto } from './dto/create-sale.dto.js';
import { DataSource, MoreThanOrEqual } from 'typeorm';
import { Sale } from './entities/sale.entity.js';
import { SaleDetail } from './entities/sale-detail.entity.js';
import { Product } from '../products/entities/product.entity.js';
import { CashShift } from '../cash-shifts/entities/cash-shift.entity.js';
import { Customer } from '../customers/entities/customer.entity.js';
import { EventsGateway } from '../events/events.gateway.js';

@Injectable()
export class SalesService {
  constructor(
    private dataSource: DataSource,
    private eventsGateway: EventsGateway,
  ) {}

  async create(createSaleDto: CreateSaleDto, userId: string, companyId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validar si hay turno abierto
      const cashShift = await queryRunner.manager.findOne(CashShift, { where: { status: 'OPEN', companyId } });
      if (!cashShift) {
        throw new BadRequestException('No se puede cobrar la venta porque no hay una caja abierta. Inicia el turno en el Dashboard.');
      }

      let total = 0;
      const saleDetails = [];

      // Validar stock de cada producto
      for (const item of createSaleDto.items) {
        const product = await queryRunner.manager.findOne(Product, { 
          where: { id: item.productId, companyId }
        });

        if (!product) {
          throw new BadRequestException(`Producto ${item.productId} no encontrado`);
        }

        const totalUnitsDeducted = item.quantity * (item.multiplier || 1);
        
        // Permitir ventas en negativo (descontar de todos modos)
        product.stock -= totalUnitsDeducted;
        await queryRunner.manager.save(product);

        const subtotal = item.quantity * item.unitPrice;
        total += subtotal;

        const detail = new SaleDetail();
        detail.productId = item.productId;
        detail.quantity = item.quantity;
        detail.unitPrice = item.unitPrice;
        detail.unitCost = product.costPrice * (item.multiplier || 1); // CONGELAR COSTO PROPORCIONAL
        detail.subtotal = subtotal;
        detail.presentationName = item.presentationName;
        detail.stockMultiplier = item.multiplier || 1;
        
        saleDetails.push(detail);
      }

      const sale = new Sale();
      sale.companyId = companyId;
      sale.total = total;
      sale.details = saleDetails;
      sale.userId = userId;
      sale.cashShiftId = cashShift.id;
      sale.isCredit = !!createSaleDto.isCredit;
      sale.paymentMethod = createSaleDto.paymentMethod || 'CASH';

      if (createSaleDto.isCredit && createSaleDto.customerId) {
        const customer = await queryRunner.manager.findOne(Customer, { where: { id: createSaleDto.customerId, companyId } });
        if (!customer) {
          throw new BadRequestException('Cliente no encontrado para la venta a crédito');
        }
        sale.customer = customer;
        customer.debt = Number(customer.debt) + total;
        await queryRunner.manager.save(customer);
      } else if (createSaleDto.customerId) {
        const customer = await queryRunner.manager.findOne(Customer, { where: { id: createSaleDto.customerId, companyId } });
        if (customer) {
          sale.customer = customer;
        }
      }

      const savedSale = await queryRunner.manager.save(sale);
      
      await queryRunner.commitTransaction();
      
      // Emitir evento WebSocket para actualizar en tiempo real las pantallas
      this.eventsGateway.emitInventoryUpdate(companyId);

      return savedSale;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  findAll(companyId: string, days?: number) {
    const where: any = { companyId };
    if (days) {
      const date = new Date();
      date.setDate(date.getDate() - days);
      where.createdAt = MoreThanOrEqual(date);
    }
    
    return this.dataSource.manager.find(Sale, { 
      where,
      relations: ['details', 'details.product', 'customer'],
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: string, companyId: string) {
    return this.dataSource.manager.findOne(Sale, {
      where: { id, companyId },
      relations: ['details', 'details.product', 'customer']
    });
  }

  async refund(id: string, companyId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const sale = await queryRunner.manager.findOne(Sale, {
        where: { id, companyId },
        relations: ['details', 'details.product', 'customer']
      });

      if (!sale) throw new BadRequestException('Venta no encontrada');
      if (sale.status === 'REFUNDED') throw new BadRequestException('La venta ya fue devuelta');

      // Revertir inventario
      for (const detail of sale.details) {
        if (detail.product) {
          const revertAmount = detail.quantity * (detail.stockMultiplier || 1);
          detail.product.stock += revertAmount;
          await queryRunner.manager.save(detail.product);
        }
      }

      // Marcar venta como devuelta
      sale.status = 'REFUNDED';
      const updatedSale = await queryRunner.manager.save(sale);

      // Revertir deuda si fue a crédito
      if (sale.isCredit && sale.customer) {
        sale.customer.debt = Math.max(0, Number(sale.customer.debt) - Number(sale.total));
        await queryRunner.manager.save(sale.customer);
      }

      await queryRunner.commitTransaction();
      return updatedSale;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
