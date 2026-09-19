import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity.js';
import { Sale } from '../sales/entities/sale.entity.js';

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

  async payDebt(id: string, amount: number) {
    const customer = await this.findOne(id);
    if (amount <= 0) {
      throw new BadRequestException('El monto del abono debe ser mayor a 0');
    }
    
    // Decrease debt, ensure it doesn't go below 0
    customer.debt = Math.max(0, Number(customer.debt) - amount);
    
    // (Optional enhancement): Track the payment in CashShift if needed later. 
    // For MVP, just adjusting the debt is enough.
    
    return this.customerRepository.save(customer);
  }

  async getCreditSales(id: string) {
    // Return all credit sales for this customer with their details
    return this.customerRepository.manager.find(Sale, {
      where: { customer: { id }, isCredit: true },
      relations: ['details', 'details.product'],
      order: { createdAt: 'DESC' }
    });
  }
}
