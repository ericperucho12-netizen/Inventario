import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ExpensesService } from './expenses.service.js';
import { CreateExpenseDto } from './dto/create-expense.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@Controller('expenses')
@UseGuards(JwtAuthGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  create(@Request() req: any, @Body() createExpenseDto: CreateExpenseDto) {
    return this.expensesService.create(createExpenseDto, req.user.companyId);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.expensesService.findAll(req.user.companyId);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.expensesService.findOne(id, req.user.companyId);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.expensesService.remove(id, req.user.companyId);
  }
}
