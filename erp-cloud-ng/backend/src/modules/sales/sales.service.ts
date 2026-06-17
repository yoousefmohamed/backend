import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { SalesInvoice, SalesInvoiceItem } from './sales-invoice.entity';
import { StockService } from '../stock/stock.service';
import { MovementType } from '../stock/stock-movement.entity';
import { TreasuryService } from '../treasury/treasury.service';
import { PartnersService } from '../partners/partners.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

interface CreateInvoiceItemInput {
  productId: string;
  unitPrice: number;
  quantity: number;
  discountAmount?: number;
}

interface CreateInvoiceInput {
  companyId: string;
  branchId?: string;
  warehouseId: string;
  partnerId?: string;
  invoiceType?: 'retail' | 'wholesale';
  items: CreateInvoiceItemInput[];
  discountAmount?: number;
  taxAmount?: number;
  paymentMethod: 'cash' | 'credit' | 'installment';
  paidAmount?: number;
  treasuryId?: string;
  createdBy: string;
}

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(SalesInvoice) private readonly invoiceRepo: Repository<SalesInvoice>,
    @InjectRepository(SalesInvoiceItem) private readonly itemRepo: Repository<SalesInvoiceItem>,
    private readonly stockService: StockService,
    private readonly treasuryService: TreasuryService,
    private readonly partnersService: PartnersService,
    private readonly dataSource: DataSource,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  private async generateInvoiceNumber(companyId: string): Promise<string> {
    const count = await this.invoiceRepo.count({ where: { companyId } });
    return `INV-${String(count + 1).padStart(6, '0')}`;
  }

  async createInvoice(input: CreateInvoiceInput): Promise<SalesInvoice> {
    if (!input.items?.length) {
      throw new BadRequestException('لا يمكن إنشاء فاتورة بدون منتجات');
    }
    if (input.paymentMethod === 'credit' && !input.partnerId) {
      throw new BadRequestException('البيع الآجل يتطلب تحديد عميل');
    }

    const subtotal = input.items.reduce(
      (sum, it) => sum + it.unitPrice * it.quantity - (it.discountAmount || 0),
      0,
    );
    const discountAmount = input.discountAmount || 0;
    const taxAmount = input.taxAmount || 0;
    const totalAmount = subtotal - discountAmount + taxAmount;
    const paidAmount =
      input.paymentMethod === 'cash' ? totalAmount : input.paidAmount || 0;

    const invoiceNumber = await this.generateInvoiceNumber(input.companyId);

    const invoice = await this.dataSource.transaction(async (manager) => {
      const newInvoice = manager.create(SalesInvoice, {
        companyId: input.companyId,
        branchId: input.branchId,
        warehouseId: input.warehouseId,
        partnerId: input.partnerId,
        invoiceNumber,
        invoiceType: input.invoiceType || 'retail',
        subtotal,
        discountAmount,
        taxAmount,
        totalAmount,
        paidAmount,
        paymentMethod: input.paymentMethod,
        status: 'completed',
        createdBy: input.createdBy,
      });
      const savedInvoice = await manager.save(newInvoice);

      const items = input.items.map((it) =>
        manager.create(SalesInvoiceItem, {
          invoiceId: savedInvoice.id,
          productId: it.productId,
          unitPrice: it.unitPrice,
          quantity: it.quantity,
          discountAmount: it.discountAmount || 0,
          totalAmount: it.unitPrice * it.quantity - (it.discountAmount || 0),
        }),
      );
      await manager.save(items);
      savedInvoice.items = items;
      return savedInvoice;
    });

    // Deduct stock for each item (outside main transaction; stockService manages its own)
    for (const item of input.items) {
      await this.stockService.adjustStock({
        companyId: input.companyId,
        productId: item.productId,
        warehouseId: input.warehouseId,
        quantityDelta: -item.quantity,
        movementType: MovementType.SALE,
        referenceType: 'sales_invoice',
        referenceId: invoice.id,
        createdBy: input.createdBy,
      });
    }

    // Cash flow: deposit into treasury if paid now
    if (paidAmount > 0 && input.treasuryId) {
      await this.treasuryService.recordTransaction({
        treasuryId: input.treasuryId,
        transactionType: 'in',
        amount: paidAmount,
        description: `تحصيل فاتورة بيع ${invoiceNumber}`,
        referenceType: 'sales_invoice',
        referenceId: invoice.id,
        createdBy: input.createdBy,
      });
    }

    // Update partner balance for credit/installment sales
    if (input.partnerId && totalAmount - paidAmount > 0) {
      await this.partnersService.adjustBalance({
        partnerId: input.partnerId,
        amountDelta: totalAmount - paidAmount,
        transactionType: 'sale_credit',
        referenceType: 'sales_invoice',
        referenceId: invoice.id,
        notes: `فاتورة بيع ${invoiceNumber}`,
      });
    }

    this.realtimeGateway.emitToCompany(input.companyId, 'sale:created', {
      invoiceId: invoice.id,
      invoiceNumber,
      totalAmount,
      paymentMethod: input.paymentMethod,
    });

    return invoice;
  }

  async findAll(companyId: string, limit = 50) {
    return this.invoiceRepo.find({
      where: { companyId },
      relations: ['items'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findById(id: string): Promise<SalesInvoice> {
    const invoice = await this.invoiceRepo.findOne({ where: { id }, relations: ['items'] });
    if (!invoice) throw new NotFoundException('الفاتورة غير موجودة');
    return invoice;
  }

  async getTodaySummary(companyId: string) {
    const result = await this.invoiceRepo
      .createQueryBuilder('inv')
      .where('inv.company_id = :companyId', { companyId })
      .andWhere('inv.created_at >= CURRENT_DATE')
      .select('COALESCE(SUM(inv.total_amount), 0)', 'totalSales')
      .addSelect('COUNT(*)', 'invoiceCount')
      .getRawOne();

    return {
      totalSales: Number(result.totalSales),
      invoiceCount: Number(result.invoiceCount),
    };
  }
}
