import { Injectable, ConflictException, NotFoundException, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity.js';

@Injectable()
export class CategoriesService implements OnModuleInit {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async onModuleInit() {
    this.logger.log('Verificando categorías por defecto...');
    const defaultCategories = [
      'Refrescos y Bebidas',
      'Abarrotes y Despensa',
      'Botanas y Dulces',
      'Lácteos y Huevos',
      'Limpieza del Hogar',
      'Cuidado Personal',
      'Panadería y Tortillas',
      'Bebidas Alcohólicas',
      'Frutas y Verduras',
      'Carnes y Embutidos',
      'Mascotas'
    ];

    let added = 0;
    for (const name of defaultCategories) {
      const existing = await this.categoryRepository.findOne({ where: { name } });
      if (!existing) {
        const cat = this.categoryRepository.create({ name, description: `Categoría de ${name}` });
        await this.categoryRepository.save(cat);
        added++;
      }
    }
    
    if (added > 0) {
      this.logger.log(`Se agregaron ${added} categorías por defecto exitosamente.`);
    } else {
      this.logger.log('Todas las categorías por defecto ya existen.');
    }
  }

  async create(createCategoryDto: Partial<Category>, companyId: string): Promise<Category> {
    const existing = await this.categoryRepository.findOne({ where: { name: createCategoryDto.name, companyId } });
    if (existing) throw new ConflictException('Ya existe una categoría con este nombre.');
    const category = this.categoryRepository.create(createCategoryDto);
    return this.categoryRepository.save(category);
  }

  findAll(companyId: string): Promise<Category[]> {
    return this.categoryRepository.find({ 
      where: { isActive: true, companyId },
      order: { name: 'ASC' }
    });
  }

  async findOne(id: string, companyId: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({ where: { id, isActive: true, companyId } });
    if (!category) throw new NotFoundException('Categoría no encontrada');
    return category;
  }

  async deactivate(id: string, companyId: string): Promise<void> {
    const category = await this.findOne(id, companyId);
    category.isActive = false;
    await this.categoryRepository.save(category);
  }
}
