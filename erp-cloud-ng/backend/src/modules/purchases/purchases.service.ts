import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PurchaseInvoice, PurchaseInvoiceItem } from './purchase-invoice.entity';
import { StockService } from '../stock/stock.service';
import { MovementType } from '../stock/stock-movement.entity';
import { PartnersService } from '../partners/partners.service';

interface CreatePurchaseInput {
  companyId: string;
  warehouseId: string;
  partnerId?: string;
  items: { productId: string; unitCost: number; quantity: number }[];
  paidAmount?: number;
  createdBy: string;
}

@Injectable()
export class PurchasesService {
  constructor(
    @InjectRepository(PurchaseInvoice) private readonly invoiceRepo: Repository<PurchaseInvoice>,
    private readonly stockService: StockService,
    private readonly partnersService: PartnersService,
    private readonly dataSource: DataSource,
  ) {}

  private async generateInvoiceNumber(companyId: string): Promise<string> {
    const count = await this.invoiceRepo.count({ where: { companyId } });
    return `PUR-${String(count + 1).padStart(6, '0')}`;
  }

  async createInvoice(input: CreatePurchaseInput) {
    if (!input.items?.length) throw new BadRequestException('لا يمكن إنشاء فاتورة شراء بدون منتجات');

    const subtotal = input.items.reduce((sum, it) => sum + it.unitCost * it.quantity, 0);
    const paidAmount = input.paidAmount || 0;
    const invoiceNumber = await this.generateInvoiceNumber(input.companyId);

    const invoice = await this.dataSource.transaction(async (manager) => {
      const newInvoice = manager.create(PurchaseInvoice, {
        companyId: input.companyId,
        warehouseId: input.warehouseId,
        partnerId: input.partnerId,
        invoiceNumber,
        subtotal,
        totalAmount: subtotal,
        paidAmount,
        status: 'received',
        createdBy: input.createdBy,
      });
      const saved = await manager.save(newInvoice);

      const items = input.items.map((it) =>
        manager.create(PurchaseInvoiceItem, {
          invoiceId: saved.id,
          productId: it.productId,
          unitCost: it.unitCost,
          quantity: it.quantity,
          totalAmount: it.unitCost * it.quantity,
        }),
      );
      await manager.save(items);
      saved.items = items;
      return saved;
    });

    for (const item of input.items) {
      await this.stockService.adjustStock({
        companyId: input.companyId,
        productId: item.productId,
        warehouseId: input.warehouseId,
        quantityDelta: item.quantity,
        movementType: MovementType.PURCHASE,
        referenceType: 'purchase_invoice',
        referenceId: invoice.id,
        createdBy: input.createdBy,
      });
    }

    if (input.partnerId && subtotal - paidAmount > 0) {
      await this.partnersService.adjustBalance({
        partnerId: input.partnerId,
        amountDelta: subtotal - paidAmount,
        transactionType: 'purchase_credit',
        referenceType: 'purchase_invoice',
        referenceId: invoice.id,
        notes: `فاتورة شراء ${invoiceNumber}`,
      });
    }

    return invoice;
  }

  async findAll(companyId: string) {
    return this.invoiceRepo.find({
      where: { companyId },
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });
  }
}
