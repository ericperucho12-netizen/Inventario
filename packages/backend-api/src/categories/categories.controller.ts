import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { CategoriesService } from './categories.service.js';
import { Category } from './entities/category.entity.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  create(@Request() req: any, @Body() createCategoryDto: Partial<Category>) {
    return this.categoriesService.create({ ...createCategoryDto, companyId: req.user.companyId }, req.user.companyId);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.categoriesService.findAll(req.user.companyId);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.categoriesService.findOne(id, req.user.companyId);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.categoriesService.deactivate(id, req.user.companyId);
  }
}
