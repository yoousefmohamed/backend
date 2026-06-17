import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('bill_of_materials')
export class BillOfMaterial {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'product_id' })
  productId: string;

  @Column({ name: 'material_product_id' })
  materialProductId: string;

  @Column({ name: 'quantity_required', type: 'numeric', precision: 14, scale: 4 })
  quantityRequired: number;
}

@Entity('production_orders')
export class ProductionOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id' })
  companyId: string;

  @Column({ name: 'product_id' })
  productId: string;

  @Column({ name: 'warehouse_id', nullable: true })
  warehouseId: string;

  @Column({ name: 'order_number', length: 40 })
  orderNumber: string;

  @Column({ name: 'quantity_planned', type: 'numeric', precision: 14, scale: 2 })
  quantityPlanned: number;

  @Column({ name: 'quantity_produced', type: 'numeric', precision: 14, scale: 2, default: 0 })
  quantityProduced: number;

  @Column({ length: 20, default: 'pending' })
  status: string;

  @Column({ name: 'total_material_cost', type: 'numeric', precision: 14, scale: 2, default: 0 })
  totalMaterialCost: number;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date;
}
