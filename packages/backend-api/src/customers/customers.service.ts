import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity.js';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
  ) {}

  create(createCustomerDto: Partial<Customer>) {
    const customer = this.customerRepository.create(createCustomerDto);
    return this.customerRepository.save(customer);
  }

  findAll() {
    return this.customerRepository.find({ where: { isActive: true } });
  }

  async findOne(id: string) {
    const customer = await this.customerRepository.findOne({ where: { id, isActive: true } });
    if (!customer) throw new NotFoundException('Cliente no encontrado');
    return customer;
  }

  async update(id: string, updateCustomerDto: Partial<Customer>) {
    const customer = await this.findOne(id);
    Object.assign(customer, updateCustomerDto);
    return this.customerRepository.save(customer);
  }

  async deactivate(id: string) {
    const customer = await this.findOne(id);
    customer.isActive = false;
    return this.customerRepository.save(customer);
  }
}
