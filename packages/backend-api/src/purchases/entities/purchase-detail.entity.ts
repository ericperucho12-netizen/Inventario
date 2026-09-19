import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Purchase } from './purchase.entity.js';
import { Product } from '../../products/entities/product.entity.js';

@Entity('purchase_details')
export class PurchaseDetail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne('Purchase', (purchase: any) => purchase.details, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'purchaseId' })
  purchase: any;

  @Column()
  purchaseId: string;

  @ManyToOne('Product')
  @JoinColumn({ name: 'productId' })
  product: any;

  @Column()
  productId: string;

  @Column('int')
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitCost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;
}
