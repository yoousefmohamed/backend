import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';

@Entity('sales_invoices')
export class SalesInvoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id' })
  companyId: string;

  @Column({ name: 'branch_id', nullable: true })
  branchId: string;

  @Column({ name: 'warehouse_id', nullable: true })
  warehouseId: string;

  @Column({ name: 'partner_id', nullable: true })
  partnerId: string;

  @Column({ name: 'invoice_number', length: 40 })
  invoiceNumber: string;

  @Column({ name: 'invoice_type', length: 20, default: 'retail' })
  invoiceType: string;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  subtotal: number;

  @Column({ name: 'discount_amount', type: 'numeric', precision: 14, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ name: 'tax_amount', type: 'numeric', precision: 14, scale: 2, default: 0 })
  taxAmount: number;

  @Column({ name: 'total_amount', type: 'numeric', precision: 14, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ name: 'paid_amount', type: 'numeric', precision: 14, scale: 2, default: 0 })
  paidAmount: number;

  @Column({ name: 'payment_method', length: 20, default: 'cash' })
  paymentMethod: string;

  @Column({ length: 20, default: 'completed' })
  status: string;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => SalesInvoiceItem, (item) => item.invoice, { cascade: true })
  items: SalesInvoiceItem[];
}

@Entity('sales_invoice_items')
export class SalesInvoiceItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'invoice_id' })
  invoiceId: string;

  @Column({ name: 'product_id' })
  productId: string;

  @Column({ name: 'unit_price', type: 'numeric', precision: 14, scale: 2 })
  unitPrice: number;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  quantity: number;

  @Column({ name: 'discount_amount', type: 'numeric', precision: 14, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ name: 'total_amount', type: 'numeric', precision: 14, scale: 2 })
  totalAmount: number;

  @ManyToOne(() => SalesInvoice, (invoice) => invoice.items)
  @JoinColumn({ name: 'invoice_id' })
  invoice: SalesInvoice;
}
