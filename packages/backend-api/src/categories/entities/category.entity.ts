import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Relation, ManyToOne, JoinColumn } from 'typeorm';
import type { Product } from '../../products/entities/product.entity.js';
import { Company } from '../../companies/entities/company.entity.js';

@Entity('categories')
export class Category {
  @Column({ nullable: true }) // TODO: Change to false when forcing multi-tenant
  companyId: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany('Product', (product: any) => product.category)
  products: any[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
