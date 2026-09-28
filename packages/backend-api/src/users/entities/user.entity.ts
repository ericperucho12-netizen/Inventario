import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Role } from '../enums/role.enum.js';
import * as bcrypt from 'bcrypt';
import { Company } from '../../companies/entities/company.entity.js';

@Entity('users')
export class User {
  @Column({ nullable: true }) // TODO: Change to false when forcing multi-tenant
  companyId: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column()
  passwordHash: string;

  @Column()
  fullName: string;

  @Column({
    type: 'varchar',
    default: Role.CAJERO,
  })
  role: Role;

  @Column({ default: true })
  isActive: boolean;

  // Campos de suscripción
  @Column({ default: false })
  isSubscribed: boolean;

  @Column({ type: 'varchar', nullable: true })
  subscriptionPlan: string;

  @Column({ type: 'timestamp', nullable: true })
  nextBillingDate: Date;

  // Campos de recuperación
  @Column({ type: 'varchar', nullable: true })
  securityQuestion: string;

  @Column({ type: 'varchar', nullable: true })
  securityAnswer: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Método helper para verificar el password
  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.passwordHash);
  }
}
