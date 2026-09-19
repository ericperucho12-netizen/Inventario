import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Supplier } from '../../suppliers/entities/supplier.entity.js';
import { PurchaseDetail } from './purchase-detail.entity.js';

@Entity('purchases')
export class Purchase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total: number;

  @ManyToOne('Supplier', (supplier: any) => supplier.purchases)
  @JoinColumn({ name: 'supplierId' })
  supplier: any;

  @Column()
  supplierId: string;

  @Column({ nullable: true })
  userId: string; // The user who registered the purchase

  @OneToMany('PurchaseDetail', (detail: any) => detail.purchase, { cascade: true })
  details: any[];

  @CreateDateColumn()
  createdAt: Date;
}
