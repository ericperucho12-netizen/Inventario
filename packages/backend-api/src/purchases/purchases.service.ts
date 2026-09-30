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

        // Actualizar Stock y Costo
        product.stock += item.quantity;
        product.costPrice = item.unitCost;
        
        // Actualizar Precio de Venta opcionalmente
        if (item.newSellingPrice !== undefined && item.newSellingPrice !== null) {
          product.sellingPrice = item.newSellingPrice;
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
}
