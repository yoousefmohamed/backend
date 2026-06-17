import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Branch } from '../branches/branch.entity';
import { User } from '../users/user.entity';

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  name: string;

  @Column({ name: 'commercial_register', length: 50, nullable: true })
  commercialRegister: string;

  @Column({ name: 'tax_number', length: 50, nullable: true })
  taxNumber: string;

  @Column({ name: 'logo_url', nullable: true, type: 'text' })
  logoUrl: string;

  @Column({ name: 'default_currency', length: 10, default: 'EGP' })
  defaultCurrency: string;

  @Column({ name: 'default_language', length: 5, default: 'ar' })
  defaultLanguage: string;

  @Column({ name: 'subscription_plan', length: 30, default: 'free' })
  subscriptionPlan: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Branch, (branch) => branch.company)
  branches: Branch[];

  @OneToMany(() => User, (user) => user.company)
  users: User[];
}
