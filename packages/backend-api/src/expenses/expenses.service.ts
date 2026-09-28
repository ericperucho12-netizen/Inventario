import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateExpenseDto } from './dto/create-expense.dto.js';
import { UpdateExpenseDto } from './dto/update-expense.dto.js';
import { Expense } from './entities/expense.entity.js';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,
  ) {}

  create(createExpenseDto: CreateExpenseDto, companyId: string) {
    const expense = this.expenseRepository.create({ ...createExpenseDto, companyId } as any);
    return this.expenseRepository.save(expense);
  }

  findAll(companyId: string) {
    return this.expenseRepository.find({ where: { companyId }, order: { createdAt: 'DESC' } });
  }

  findOne(id: string, companyId: string) {
    return this.expenseRepository.findOne({ where: { id, companyId } });
  }

  async remove(id: string, companyId: string) {
    const expense = await this.findOne(id, companyId);
    if (expense) {
      await this.expenseRepository.remove(expense);
    }
  }
}
