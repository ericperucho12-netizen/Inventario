import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { CreatePurchaseDto } from './dto/create-purchase.dto.js';
import { DataSource } from 'typeorm';
import { Purchase } from './entities/purchase.entity.js';
import { PurchaseDetail } from './entities/purchase-detail.entity.js';
import { Product } from '../products/entities/product.entity.js';
import { Supplier } from '../suppliers/entities/supplier.entity.js';
import { EventsGateway } from '../events/events.gateway.js';

@Injectable()
export class PurchasesService {
  constructor(
    private dataSource: DataSource,
    private eventsGateway: EventsGateway,
  ) {}

  async create(createPurchaseDto: CreatePurchaseDto, userId: string, companyId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let supplier = null;
      if (createPurchaseDto.supplierId) {
        supplier = await queryRunner.manager.findOneBy(Supplier, { id: createPurchaseDto.supplierId, isActive: true, companyId });
        if (!supplier) throw new NotFoundException('Proveedor no encontrado');
      }

      let total = 0;
      const details = [];

      for (const item of createPurchaseDto.items) {
        const product = await queryRunner.manager.findOneBy(Product, { id: item.productId, companyId });
        if (!product) throw new BadRequestException(`Producto ${item.productId} no encontrado`);

        // Actualizar Precio de Venta opcionalmente
        if (item.newSellingPrice !== undefined && item.newSellingPrice !== null) {
          product.sellingPrice = item.newSellingPrice;
        }

        // Solo actualizar stock y costo si la compra NO está pendiente
        if (createPurchaseDto.status !== 'PENDING') {
          product.stock += item.quantity;
          product.costPrice = item.unitCost;
        }

        await queryRunner.manager.save(product);

        const subtotal = item.quantity * item.unitCost;
        total += subtotal;

        const detail = new PurchaseDetail();
        detail.productId = product.id;
        detail.quantity = item.quantity;
        detail.unitCost = item.unitCost;
        detail.subtotal = subtotal;
        
        details.push(detail);
      }

      const purchase = new Purchase();
      purchase.companyId = companyId;
      if (supplier) {
        purchase.supplierId = supplier.id;
      }
      purchase.total = total;
      purchase.userId = userId;
      purchase.details = details;
      if (createPurchaseDto.status) {
        purchase.status = createPurchaseDto.status;
      }

      const savedPurchase = await queryRunner.manager.save(purchase);
      
      await queryRunner.commitTransaction();
      
      this.eventsGateway.emitInventoryUpdate(companyId);

      return savedPurchase;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  findAll(companyId: string) {
    return this.dataSource.manager.find(Purchase, { 
      where: { companyId },
      relations: ['supplier', 'details', 'details.product'],
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: string, companyId: string) {
    const purchase = await this.dataSource.manager.findOne(Purchase, {
      where: { id, companyId },
      relations: ['supplier', 'details', 'details.product']
    });
    if (!purchase) throw new NotFoundException('Compra no encontrada');
    return purchase;
  }

  async receive(id: string, companyId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const purchase = await queryRunner.manager.findOne(Purchase, {
        where: { id, companyId },
        relations: ['details', 'details.product']
      });

      if (!purchase) throw new NotFoundException('Compra no encontrada');
      if (purchase.status === 'COMPLETED') throw new BadRequestException('Esta compra ya fue recibida');

      // Actualizar stock de cada producto
      for (const detail of purchase.details) {
        const product = await queryRunner.manager.findOneBy(Product, { id: detail.productId, companyId });
        if (product) {
          product.stock += detail.quantity;
          product.costPrice = detail.unitCost;
          await queryRunner.manager.save(product);
        }
      }

      purchase.status = 'COMPLETED';
      const savedPurchase = await queryRunner.manager.save(purchase);
      
      await queryRunner.commitTransaction();
      this.eventsGateway.emitInventoryUpdate(companyId);

      return savedPurchase;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: string, companyId: string) {
    const purchase = await this.dataSource.manager.findOne(Purchase, {
      where: { id, companyId }
    });
    if (!purchase) throw new NotFoundException('Compra no encontrada');
    if (purchase.status === 'COMPLETED') throw new BadRequestException('No se puede eliminar una compra completada');
    
    await this.dataSource.manager.remove(purchase);
    
    this.eventsGateway.emitInventoryUpdate(companyId);
    
    return { success: true };
  }
}
