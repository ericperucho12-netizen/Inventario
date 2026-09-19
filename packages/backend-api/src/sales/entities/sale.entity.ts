import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import type { SaleDetail } from './sale-detail.entity.js';

@Entity('sales')
export class Sale {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total: number;

  @Column({ default: 'COMPLETED' })
  status: 'COMPLETED' | 'REFUNDED';

  @OneToMany('SaleDetail', (detail: any) => detail.sale, { cascade: true })
  details: any[];

  @Column({ nullable: true })
  userId: string; // The cashier who made the sale

  @Column({ nullable: true })
  cashShiftId: string; // El turno de caja en el que se hizo la venta

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
