import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Customer } from './entities/customer.entity.js';
import { Sale } from '../sales/entities/sale.entity.js';
import { CashShift } from '../cash-shifts/entities/cash-shift.entity.js';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
  ) {}

  create(createCustomerDto: Partial<Customer>, companyId: string) {
    const customer = this.customerRepository.create({ ...createCustomerDto, companyId });
    return this.customerRepository.save(customer);
  }

  findAll(companyId: string) {
    return this.customerRepository.find({ 
      where: { isActive: true, companyId },
      order: { name: 'ASC' }
    });
  }

  async findOne(id: string, companyId: string) {
    const customer = await this.customerRepository.findOne({ where: { id, isActive: true, companyId } });
    if (!customer) throw new NotFoundException('Cliente no encontrado');
    return customer;
  }

  async update(id: string, updateCustomerDto: Partial<Customer>, companyId: string) {
    const customer = await this.findOne(id, companyId);
    Object.assign(customer, updateCustomerDto);
    return this.customerRepository.save(customer);
  }

  async deactivate(id: string, companyId: string) {
    const customer = await this.findOne(id, companyId);
    if (Number(customer.debt) > 0) {
      throw new BadRequestException('No se puede eliminar un cliente que tiene una deuda pendiente.');
    }
    customer.isActive = false;
    return this.customerRepository.save(customer);
  }

  async payDebt(id: string, amount: number, companyId: string) {
    const customer = await this.findOne(id, companyId);
    if (amount <= 0) {
      throw new BadRequestException('El monto del abono debe ser mayor a 0');
    }
    
    // Decrease debt, ensure it doesn't go below 0
    customer.debt = Math.max(0, Number(customer.debt) - amount);
    await this.customerRepository.save(customer);

    // If debt is 0 (or practically 0 due to floats), mark all credit sales as paid
    if (customer.debt <= 0.01) {
      await this.customerRepository.manager.update(Sale, 
        { customer: { id }, isCredit: true, isCreditPaid: false, companyId }, 
        { isCreditPaid: true }
      );
    } else {
      // Repartir el abono en las ventas más antiguas
      let remainingPayment = amount;
      const unpaidSales = await this.customerRepository.manager.find(Sale, {
        where: { customer: { id }, isCredit: true, isCreditPaid: false, companyId },
        order: { createdAt: 'ASC' }
      });

      for (const sale of unpaidSales) {
        if (remainingPayment <= 0) break;
        const saleAmount = Number(sale.total);
        if (remainingPayment >= saleAmount) {
          sale.isCreditPaid = true;
          remainingPayment -= saleAmount;
          await this.customerRepository.manager.save(sale);
        }
      }
    }

    // Add payment to the current cash shift as extraIncome
    const currentShift = await this.customerRepository.manager.findOne(CashShift, {
      where: { status: 'OPEN', companyId }
    });
    if (currentShift) {
      currentShift.extraIncome = Number(currentShift.extraIncome || 0) + amount;
      await this.customerRepository.manager.save(currentShift);
    }

    return customer;
  }

  async getCreditSales(id: string, companyId: string) {
    // Return all credit sales for this customer with their details that are not yet paid
    return this.customerRepository.manager.find(Sale, {
      where: { customer: { id }, isCredit: true, isCreditPaid: false, companyId },
      relations: ['details', 'details.product'],
      order: { createdAt: 'DESC' }
    });
  }
}
