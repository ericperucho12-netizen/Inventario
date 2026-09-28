import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { CustomersService } from './customers.service.js';
import { Customer } from './entities/customer.entity.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@UseGuards(JwtAuthGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  create(@Request() req: any, @Body() createCustomerDto: Partial<Customer>) {
    return this.customersService.create(createCustomerDto, req.user.companyId);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.customersService.findAll(req.user.companyId);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.customersService.findOne(id, req.user.companyId);
  }

  @Patch(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() updateCustomerDto: Partial<Customer>) {
    return this.customersService.update(id, updateCustomerDto, req.user.companyId);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.customersService.deactivate(id, req.user.companyId);
  }

  @Post(':id/pay-debt')
  payDebt(@Request() req: any, @Param('id') id: string, @Body('amount') amount: number) {
    return this.customersService.payDebt(id, amount, req.user.companyId);
  }

  @Get(':id/credit-sales')
  getCreditSales(@Request() req: any, @Param('id') id: string) {
    return this.customersService.getCreditSales(id, req.user.companyId);
  }
}
