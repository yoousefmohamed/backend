import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';

@Entity('purchase_invoices')
export class PurchaseInvoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id' })
  companyId: string;

  @Column({ name: 'warehouse_id', nullable: true })
  warehouseId: string;

  @Column({ name: 'partner_id', nullable: true })
  partnerId: string;

  @Column({ name: 'invoice_number', length: 40 })
  invoiceNumber: string;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  subtotal: number;

  @Column({ name: 'total_amount', type: 'numeric', precision: 14, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ name: 'paid_amount', type: 'numeric', precision: 14, scale: 2, default: 0 })
  paidAmount: number;

  @Column({ length: 20, default: 'received' })
  status: string;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => PurchaseInvoiceItem, (item) => item.invoice, { cascade: true })
  items: PurchaseInvoiceItem[];
}

@Entity('purchase_invoice_items')
export class PurchaseInvoiceItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'invoice_id' })
  invoiceId: string;

  @Column({ name: 'product_id' })
  productId: string;

  @Column({ name: 'unit_cost', type: 'numeric', precision: 14, scale: 2 })
  unitCost: number;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  quantity: number;

  @Column({ name: 'total_amount', type: 'numeric', precision: 14, scale: 2 })
  totalAmount: number;

  @ManyToOne(() => PurchaseInvoice, (invoice) => invoice.items)
  @JoinColumn({ name: 'invoice_id' })
  invoice: PurchaseInvoice;
}
