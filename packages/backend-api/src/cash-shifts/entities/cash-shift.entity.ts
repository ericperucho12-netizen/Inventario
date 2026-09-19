import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('cash_shifts')
export class CashShift {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  initialAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  declaredAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  systemAmount: number;

  @Column({ default: 'OPEN' })
  status: 'OPEN' | 'CLOSED';

  @Column()
  userId: string;

  @CreateDateColumn()
  openedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  closedAt: Date;
}
