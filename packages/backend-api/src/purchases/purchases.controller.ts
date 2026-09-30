import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { PurchasesService } from './purchases.service.js';
import { CreatePurchaseDto } from './dto/create-purchase.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@UseGuards(JwtAuthGuard)
@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Post()
  create(@Body() createPurchaseDto: CreatePurchaseDto, @Request() req: any) {
    return this.purchasesService.create(createPurchaseDto, req.user.userId, req.user.companyId);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.purchasesService.findAll(req.user.companyId);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.purchasesService.findOne(id, req.user.companyId);
  }

  @Patch(':id/receive')
  receive(@Request() req: any, @Param('id') id: string) {
    return this.purchasesService.receive(id, req.user.companyId);
  }
}
