import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity.js';
import { CategoriesService } from '../categories/categories.service.js';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private categoriesService: CategoriesService,
  ) {}

  async create(createProductDto: Partial<Product>, companyId: string): Promise<Product> {
    const existing = await this.productRepository.findOne({ where: { barcode: createProductDto.barcode, companyId } });
    
    if (existing) {
      if (existing.isActive) {
        throw new ConflictException('Ya existe un producto activo con este código de barras.');
      } else {
        // Restaurar producto soft-deleted con nuevos datos
        if (!createProductDto.categoryId) {
          throw new ConflictException('El producto debe pertenecer a una categoría.');
        }
        const category = await this.categoriesService.findOne(createProductDto.categoryId, companyId);
        Object.assign(existing, {
          ...createProductDto,
          category,
          isActive: true
        });
        return this.productRepository.save(existing);
      }
    }
    
    // Validar existencia de categoría (Cumplimiento RN-013)
    if (!createProductDto.categoryId) {
      throw new ConflictException('El producto debe pertenecer a una categoría.');
    }
    const category = await this.categoriesService.findOne(createProductDto.categoryId, companyId);

    const product = this.productRepository.create({
      ...createProductDto,
      category, // Assign the relation object
    });
    return this.productRepository.save(product);
  }

  findAll(companyId: string): Promise<Product[]> {
    return this.productRepository.find({ 
      where: { isActive: true, companyId },
      relations: ['category'], // Retornar junto a su categoría
      order: { description: 'ASC' }
    });
  }

  async findOne(id: string, companyId: string): Promise<Product> {
    const product = await this.productRepository.findOne({ 
      where: { id, isActive: true, companyId },
      relations: ['category']
    });
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }

  async update(id: string, updateProductDto: Partial<Product>, companyId: string): Promise<Product> {
    const product = await this.findOne(id, companyId);
    if (updateProductDto.categoryId) {
      const category = await this.categoriesService.findOne(updateProductDto.categoryId, companyId);
      updateProductDto.category = category as any;
    }
    Object.assign(product, updateProductDto);
    return this.productRepository.save(product);
  }

  async deactivate(id: string, companyId: string): Promise<void> {
    const product = await this.findOne(id, companyId);
    product.isActive = false;
    await this.productRepository.save(product);
  }
}
