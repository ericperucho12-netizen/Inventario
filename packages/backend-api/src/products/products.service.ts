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

  async create(createProductDto: Partial<Product>): Promise<Product> {
    const existing = await this.productRepository.findOne({ where: { barcode: createProductDto.barcode } });
    if (existing) throw new ConflictException('Ya existe un producto con este código de barras.');
    
    // Validar existencia de categoría (Cumplimiento RN-013)
    if (!createProductDto.categoryId) {
      throw new ConflictException('El producto debe pertenecer a una categoría.');
    }
    const category = await this.categoriesService.findOne(createProductDto.categoryId);

    const product = this.productRepository.create({
      ...createProductDto,
      category, // Assign the relation object
    });
    return this.productRepository.save(product);
  }

  findAll(): Promise<Product[]> {
    return this.productRepository.find({ 
      where: { isActive: true },
      relations: ['category'] // Retornar junto a su categoría
    });
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({ 
      where: { id, isActive: true },
      relations: ['category']
    });
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }

  async update(id: string, updateProductDto: Partial<Product>): Promise<Product> {
    const product = await this.findOne(id);
    if (updateProductDto.categoryId) {
      const category = await this.categoriesService.findOne(updateProductDto.categoryId);
      updateProductDto.category = category as any;
    }
    Object.assign(product, updateProductDto);
    return this.productRepository.save(product);
  }

  async deactivate(id: string): Promise<void> {
    const product = await this.findOne(id);
    product.isActive = false;
    await this.productRepository.save(product);
  }
}
