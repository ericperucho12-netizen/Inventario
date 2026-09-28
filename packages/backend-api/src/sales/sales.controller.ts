import { Controller, Get, Post, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { SalesService } from './sales.service.js';
import { CreateSaleDto } from './dto/create-sale.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@UseGuards(JwtAuthGuard)
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  create(@Body() createSaleDto: CreateSaleDto, @Request() req: any) {
    // req.user contains the decoded JWT token payload
    const userId = req.user.userId;
    return this.salesService.create(createSaleDto, userId, req.user.companyId);
  }

  @Get()
  findAll(@Request() req: any, @Query('days') days?: number) {
    return this.salesService.findAll(req.user.companyId, days);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.salesService.findOne(id, req.user.companyId);
  }

  @Post(':id/refund')
  refund(@Request() req: any, @Param('id') id: string) {
    return this.salesService.refund(id, req.user.companyId);
  }
}
