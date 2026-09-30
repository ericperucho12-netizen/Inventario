import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Company } from '../../companies/entities/company.entity.js';

@Entity('cash_shifts')
export class CashShift {
  @Column({ nullable: true }) // TODO: Change to false when forcing multi-tenant
  companyId: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  initialAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  declaredAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  systemAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  extraIncome: number;

  @Column({ default: 'OPEN' })
  status: 'OPEN' | 'CLOSED';

  @Column()
  userId: string;

  @CreateDateColumn()
  openedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  closedAt: Date;
}
