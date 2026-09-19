import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSupplierDto } from './dto/create-supplier.dto.js';
import { UpdateSupplierDto } from './dto/update-supplier.dto.js';
import { DataSource } from 'typeorm';
import { Supplier } from './entities/supplier.entity.js';

@Injectable()
export class SuppliersService {
  constructor(private dataSource: DataSource) {}

  create(createSupplierDto: CreateSupplierDto) {
    const supplier = this.dataSource.manager.create(Supplier, createSupplierDto);
    return this.dataSource.manager.save(supplier);
  }

  findAll() {
    return this.dataSource.manager.find(Supplier, { where: { isActive: true } });
  }

  async findOne(id: string) {
    const supplier = await this.dataSource.manager.findOneBy(Supplier, { id, isActive: true });
    if (!supplier) throw new NotFoundException('Proveedor no encontrado');
    return supplier;
  }

  async update(id: string, updateSupplierDto: UpdateSupplierDto) {
    await this.findOne(id);
    await this.dataSource.manager.update(Supplier, id, updateSupplierDto);
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.dataSource.manager.update(Supplier, id, { isActive: false });
  }
}
