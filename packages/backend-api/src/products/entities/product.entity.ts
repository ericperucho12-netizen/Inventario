import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import type { Category } from '../../categories/entities/category.entity.js';
import { Company } from '../../companies/entities/company.entity.js';

export class ColumnNumericTransformer {
  to(data: number): number {
    return data;
  }
  from(data: string): number {
    return parseFloat(data);
  }
}

@Entity('products')
@Unique(['companyId', 'barcode'])
export class Product {
  @Column({ nullable: true }) // TODO: Change to false when forcing multi-tenant
  companyId: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  barcode: string;

  @Column()
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, transformer: new ColumnNumericTransformer() })
  costPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, transformer: new ColumnNumericTransformer() })
  sellingPrice: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'simple-json', nullable: true })
  presentations?: any[];

  @Column({ default: false })
  canUnpack: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0, transformer: new ColumnNumericTransformer() })
  stock: number;

  @Column({ default: false })
  isBulk: boolean;

  @Column({ nullable: true })
  imageUrl: string;

  @ManyToOne('Category', (category: any) => category.products, { nullable: false })
  @JoinColumn({ name: 'categoryId' })
  category: any;

  @Column()
  categoryId: string; // Relación obligatoria según RN-013

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
