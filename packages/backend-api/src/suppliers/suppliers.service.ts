import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSupplierDto } from './dto/create-supplier.dto.js';
import { UpdateSupplierDto } from './dto/update-supplier.dto.js';
import { DataSource } from 'typeorm';
import { Supplier } from './entities/supplier.entity.js';

@Injectable()
export class SuppliersService {
  constructor(private dataSource: DataSource) {}

  create(createSupplierDto: CreateSupplierDto, companyId: string) {
    const supplier = this.dataSource.manager.create(Supplier, { ...createSupplierDto, companyId } as any);
    return this.dataSource.manager.save(supplier);
  }

  findAll(companyId: string) {
    return this.dataSource.manager.find(Supplier, { 
      where: { isActive: true, companyId },
      order: { name: 'ASC' }
    });
  }

  async findOne(id: string, companyId: string) {
    const supplier = await this.dataSource.manager.findOneBy(Supplier, { id, isActive: true, companyId });
    if (!supplier) throw new NotFoundException('Proveedor no encontrado');
    return supplier;
  }

  async update(id: string, updateSupplierDto: UpdateSupplierDto, companyId: string) {
    await this.findOne(id, companyId);
    await this.dataSource.manager.update(Supplier, { id, companyId }, updateSupplierDto as any);
    return this.findOne(id, companyId);
  }

  async remove(id: string, companyId: string) {
    await this.findOne(id, companyId);
    await this.dataSource.manager.update(Supplier, { id, companyId }, { isActive: false } as any);
  }
}
