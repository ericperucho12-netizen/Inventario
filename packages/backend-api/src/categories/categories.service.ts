import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity.js';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async create(createCategoryDto: Partial<Category>): Promise<Category> {
    const existing = await this.categoryRepository.findOne({ where: { name: createCategoryDto.name } });
    if (existing) throw new ConflictException('Ya existe una categoría con este nombre.');
    const category = this.categoryRepository.create(createCategoryDto);
    return this.categoryRepository.save(category);
  }

  findAll(): Promise<Category[]> {
    return this.categoryRepository.find({ where: { isActive: true } });
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({ where: { id, isActive: true } });
    if (!category) throw new NotFoundException('Categoría no encontrada');
    return category;
  }

  async deactivate(id: string): Promise<void> {
    const category = await this.findOne(id);
    category.isActive = false;
    await this.categoryRepository.save(category);
  }
}
