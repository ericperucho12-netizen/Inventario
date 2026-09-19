import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import type { Sale } from './sale.entity.js';
import type { Product } from '../../products/entities/product.entity.js';

@Entity('sale_details')
export class SaleDetail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne('Sale', (sale: any) => sale.details, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'saleId' })
  sale: any;

  @Column()
  saleId: string;

  @ManyToOne('Product', { nullable: false })
  @JoinColumn({ name: 'productId' })
  product: any;

  @Column()
  productId: string;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  unitCost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  subtotal: number;
}
