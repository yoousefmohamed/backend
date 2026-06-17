import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('treasuries')
export class Treasury {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id' })
  companyId: string;

  @Column({ name: 'branch_id', nullable: true })
  branchId: string;

  @Column({ length: 120 })
  name: string;

  @Column({ name: 'treasury_type', length: 20, default: 'cash' })
  treasuryType: string;

  @Column({ name: 'current_balance', type: 'numeric', precision: 14, scale: 2, default: 0 })
  currentBalance: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}

@Entity('treasury_transactions')
export class TreasuryTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'treasury_id' })
  treasuryId: string;

  @Column({ name: 'transaction_type', length: 20 })
  transactionType: string;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  amount: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'reference_type', length: 40, nullable: true })
  referenceType: string;

  @Column({ name: 'reference_id', nullable: true })
  referenceId: string;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
