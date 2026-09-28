import { Controller, Get, Post, Body, Param, Delete, UseGuards, Patch, Request } from '@nestjs/common';
import { ProductsService } from './products.service.js';
import { Product } from './entities/product.entity.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(@Request() req: any, @Body() createProductDto: Partial<Product>) {
    return this.productsService.create({ ...createProductDto, companyId: req.user.companyId }, req.user.companyId);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.productsService.findAll(req.user.companyId);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.productsService.findOne(id, req.user.companyId);
  }

  @Patch(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() updateProductDto: Partial<Product>) {
    return this.productsService.update(id, updateProductDto, req.user.companyId);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.productsService.deactivate(id, req.user.companyId);
  }
}
