import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateSaleDto } from './dto/create-sale.dto.js';
import { DataSource } from 'typeorm';
import { Sale } from './entities/sale.entity.js';
import { SaleDetail } from './entities/sale-detail.entity.js';
import { Product } from '../products/entities/product.entity.js';
import { CashShift } from '../cash-shifts/entities/cash-shift.entity.js';

@Injectable()
export class SalesService {
  constructor(private dataSource: DataSource) {}

  async create(createSaleDto: CreateSaleDto, userId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validar si hay turno abierto
      const cashShift = await queryRunner.manager.findOne(CashShift, { where: { status: 'OPEN' } });
      if (!cashShift) {
        throw new BadRequestException('No se puede cobrar la venta porque no hay una caja abierta. Inicia el turno en el Dashboard.');
      }

      let total = 0;
      const saleDetails = [];

      // Validar stock de cada producto
      for (const item of createSaleDto.items) {
        const product = await queryRunner.manager.findOne(Product, { 
          where: { id: item.productId }
        });

        if (!product) {
          throw new BadRequestException(`Producto ${item.productId} no encontrado`);
        }

        if (product.stock < item.quantity) {
          throw new BadRequestException(`No hay suficiente stock para el producto ${product.description}`);
        }

        // Descontar inventario
        product.stock -= item.quantity;
        await queryRunner.manager.save(product);

        const subtotal = item.quantity * item.unitPrice;
        total += subtotal;

        const detail = new SaleDetail();
        detail.productId = item.productId;
        detail.quantity = item.quantity;
        detail.unitPrice = item.unitPrice;
        detail.unitCost = product.costPrice; // CONGELAR COSTO
        detail.subtotal = subtotal;
        
        saleDetails.push(detail);
      }

      const sale = new Sale();
      sale.total = total;
      sale.details = saleDetails;
      sale.userId = userId;
      sale.cashShiftId = cashShift.id;

      const savedSale = await queryRunner.manager.save(sale);
      
      await queryRunner.commitTransaction();
      return savedSale;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  findAll() {
    return this.dataSource.manager.find(Sale, { 
      relations: ['details', 'details.product'],
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: string) {
    return this.dataSource.manager.findOne(Sale, {
      where: { id },
      relations: ['details', 'details.product']
    });
  }

  async refund(id: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const sale = await queryRunner.manager.findOne(Sale, {
        where: { id },
        relations: ['details', 'details.product']
      });

      if (!sale) throw new BadRequestException('Venta no encontrada');
      if (sale.status === 'REFUNDED') throw new BadRequestException('La venta ya fue devuelta');

      // Revertir inventario
      for (const detail of sale.details) {
        if (detail.product) {
          detail.product.stock += detail.quantity;
          await queryRunner.manager.save(detail.product);
        }
      }

      // Marcar venta como devuelta
      sale.status = 'REFUNDED';
      const updatedSale = await queryRunner.manager.save(sale);

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
