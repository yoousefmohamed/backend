import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BillOfMaterial, ProductionOrder } from './production.entity';
import { StockService } from '../stock/stock.service';
import { MovementType } from '../stock/stock-movement.entity';
import { ProductsService } from '../products/products.service';

@Injectable()
export class ProductionService {
  constructor(
    @InjectRepository(BillOfMaterial) private readonly bomRepo: Repository<BillOfMaterial>,
    @InjectRepository(ProductionOrder) private readonly orderRepo: Repository<ProductionOrder>,
    private readonly stockService: StockService,
    private readonly productsService: ProductsService,
  ) {}

  async getBOM(productId: string) {
    return this.bomRepo.find({ where: { productId } });
  }

  async setBOM(productId: string, materials: { materialProductId: string; quantityRequired: number }[]) {
    await this.bomRepo.delete({ productId });
    const rows = materials.map((m) =>
      this.bomRepo.create({ productId, materialProductId: m.materialProductId, quantityRequired: m.quantityRequired }),
    );
    return this.bomRepo.save(rows);
  }

  async checkMaterialAvailability(productId: string, warehouseId: string, plannedQuantity: number) {
    const bom = await this.getBOM(productId);
    const results = [];
    for (const line of bom) {
      const available = await this.stockService.getQuantity(line.materialProductId, warehouseId);
      const needed = Number(line.quantityRequired) * plannedQuantity;
      results.push({
        materialProductId: line.materialProductId,
        needed,
        available,
        sufficient: available >= needed,
      });
    }
    return results;
  }

  private async generateOrderNumber(companyId: string): Promise<string> {
    const count = await this.orderRepo.count({ where: { companyId } });
    return `PO-${String(count + 1).padStart(5, '0')}`;
  }

  async createOrder(input: {
    companyId: string;
    productId: string;
    warehouseId: string;
    quantityPlanned: number;
    createdBy: string;
  }) {
    const orderNumber = await this.generateOrderNumber(input.companyId);
    const order = this.orderRepo.create({
      companyId: input.companyId,
      productId: input.productId,
      warehouseId: input.warehouseId,
      orderNumber,
      quantityPlanned: input.quantityPlanned,
      status: 'pending',
      createdBy: input.createdBy,
    });
    return this.orderRepo.save(order);
  }

  /**
   * Completes a production order: deducts raw materials from stock,
   * adds the finished product to stock, and calculates production cost.
   */
  async completeOrder(orderId: string, userId: string) {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('أمر الإنتاج غير موجود');
    if (order.status === 'completed') {
      throw new BadRequestException('أمر الإنتاج مكتمل بالفعل');
    }

    const bom = await this.getBOM(order.productId);
    let totalCost = 0;

    for (const line of bom) {
      const requiredQty = Number(line.quantityRequired) * Number(order.quantityPlanned);
      const material = await this.productsService.findById(line.materialProductId);

      await this.stockService.adjustStock({
        companyId: order.companyId,
        productId: line.materialProductId,
        warehouseId: order.warehouseId,
        quantityDelta: -requiredQty,
        movementType: MovementType.PRODUCTION_OUT,
        referenceType: 'production_order',
        referenceId: order.id,
        createdBy: userId,
      });

      totalCost += requiredQty * Number(material.costPrice);
    }

    await this.stockService.adjustStock({
      companyId: order.companyId,
      productId: order.productId,
      warehouseId: order.warehouseId,
      quantityDelta: Number(order.quantityPlanned),
      movementType: MovementType.PRODUCTION_IN,
      referenceType: 'production_order',
      referenceId: order.id,
      createdBy: userId,
    });

    order.status = 'completed';
    order.quantityProduced = order.quantityPlanned;
    order.totalMaterialCost = totalCost;
    order.completedAt = new Date();
    return this.orderRepo.save(order);
  }

  async findAll(companyId: string) {
    return this.orderRepo.find({ where: { companyId }, order: { createdAt: 'DESC' } });
  }
}
