import { Controller, Get, Post, Body, Param, Delete, UseGuards, Patch, Request, HttpCode } from '@nestjs/common';
import { ProductsService } from './products.service.js';
import { Product } from './entities/product.entity.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { EventsGateway } from '../events/events.gateway.js';

@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly eventsGateway: EventsGateway
  ) {}

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

  @Post(':id/adjust')
  @HttpCode(200)
  async adjustStock(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { delta: number; reason: string }
  ) {
    const product = await this.productsService.adjustStock(id, body.delta, body.reason, req.user.companyId);
    this.eventsGateway.emitInventoryUpdate(req.user.companyId);
    return product;
  }

  @Post(':id/unpack')
  @HttpCode(200)
  async unpack(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { targetId: string; units: number }
  ) {
    const result = await this.productsService.unpackProduct(id, body.targetId, body.units, req.user.companyId);
    this.eventsGateway.emitInventoryUpdate(req.user.companyId);
    return result;
  }
}
