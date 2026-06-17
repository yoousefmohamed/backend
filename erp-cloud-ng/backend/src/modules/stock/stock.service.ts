import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { StockLevel } from './stock-level.entity';
import { StockMovement, MovementType } from './stock-movement.entity';

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(StockLevel) private readonly stockRepo: Repository<StockLevel>,
    @InjectRepository(StockMovement) private readonly movementRepo: Repository<StockMovement>,
    private readonly dataSource: DataSource,
  ) {}

  async getQuantity(productId: string, warehouseId: string): Promise<number> {
    const level = await this.stockRepo.findOne({ where: { productId, warehouseId } });
    return level ? Number(level.quantity) : 0;
  }

  async getProductStockAcrossWarehouses(productId: string) {
    return this.stockRepo.find({ where: { productId } });
  }

  /**
   * Atomically adjusts stock and logs the movement. Positive qty = stock in, negative = stock out.
   * Throws if the resulting quantity would go negative (unless allowNegative is true).
   */
  async adjustStock(params: {
    companyId: string;
    productId: string;
    warehouseId: string;
    quantityDelta: number;
    movementType: MovementType;
    referenceType?: string;
    referenceId?: string;
    notes?: string;
    createdBy?: string;
    allowNegative?: boolean;
  }): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      let level = await manager.findOne(StockLevel, {
        where: { productId: params.productId, warehouseId: params.warehouseId },
      });

      if (!level) {
        level = manager.create(StockLevel, {
          productId: params.productId,
          warehouseId: params.warehouseId,
          quantity: 0,
        });
      }

      const newQuantity = Number(level.quantity) + params.quantityDelta;

      if (newQuantity < 0 && !params.allowNegative) {
        throw new BadRequestException('الكمية المتاحة في المخزون غير كافية');
      }

      level.quantity = newQuantity;
      await manager.save(level);

      const movement = manager.create(StockMovement, {
        companyId: params.companyId,
        productId: params.productId,
        warehouseId: params.warehouseId,
        movementType: params.movementType,
        quantity: params.quantityDelta,
        referenceType: params.referenceType,
        referenceId: params.referenceId,
        notes: params.notes,
        createdBy: params.createdBy,
      });
      await manager.save(movement);
    });
  }

  async getLowStockProducts(companyId: string, warehouseId?: string) {
    const query = this.stockRepo
      .createQueryBuilder('sl')
      .innerJoin('products', 'p', 'p.id = sl.product_id')
      .where('p.company_id = :companyId', { companyId })
      .andWhere('sl.quantity <= p.min_stock_level')
      .select(['sl.product_id', 'sl.warehouse_id', 'sl.quantity', 'p.name', 'p.min_stock_level']);

    if (warehouseId) query.andWhere('sl.warehouse_id = :warehouseId', { warehouseId });

    return query.getRawMany();
  }

  async transferStock(params: {
    companyId: string;
    productId: string;
    fromWarehouseId: string;
    toWarehouseId: string;
    quantity: number;
    createdBy?: string;
  }): Promise<void> {
    await this.adjustStock({
      companyId: params.companyId,
      productId: params.productId,
      warehouseId: params.fromWarehouseId,
      quantityDelta: -params.quantity,
      movementType: MovementType.TRANSFER_OUT,
      referenceType: 'stock_transfer',
      createdBy: params.createdBy,
    });
    await this.adjustStock({
      companyId: params.companyId,
      productId: params.productId,
      warehouseId: params.toWarehouseId,
      quantityDelta: params.quantity,
      movementType: MovementType.TRANSFER_IN,
      referenceType: 'stock_transfer',
      createdBy: params.createdBy,
    });
  }
}
