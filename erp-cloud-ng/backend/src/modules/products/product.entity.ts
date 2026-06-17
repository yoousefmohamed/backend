import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id' })
  companyId: string;

  @Column({ name: 'category_id', nullable: true })
  categoryId: string;

  @Column({ name: 'base_unit_id', nullable: true })
  baseUnitId: string;

  @Column({ length: 200 })
  name: string;

  @Column({ length: 80, nullable: true })
  sku: string;

  @Column({ length: 80, nullable: true })
  barcode: string;

  @Column({ name: 'qr_code', type: 'text', nullable: true })
  qrCode: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'cost_price', type: 'numeric', precision: 14, scale: 2, default: 0 })
  costPrice: number;

  @Column({ name: 'sale_price', type: 'numeric', precision: 14, scale: 2, default: 0 })
  salePrice: number;

  @Column({ name: 'wholesale_price', type: 'numeric', precision: 14, scale: 2, nullable: true })
  wholesalePrice: number;

  @Column({ name: 'min_stock_level', type: 'numeric', precision: 14, scale: 2, default: 0 })
  minStockLevel: number;

  @Column({ name: 'track_expiry', default: false })
  trackExpiry: boolean;

  @Column({ name: 'track_batches', default: false })
  trackBatches: boolean;

  @Column({ name: 'is_produced', default: false })
  isProduced: boolean;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
