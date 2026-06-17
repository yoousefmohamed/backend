import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { StockService } from './stock.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';

@ApiTags('stock')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get('product/:productId')
  @RequirePermission('products', 'view')
  getProductStock(@Param('productId') productId: string) {
    return this.stockService.getProductStockAcrossWarehouses(productId);
  }

  @Get('low-stock')
  @RequirePermission('products', 'view')
  getLowStock(@Req() req: any, @Query('warehouseId') warehouseId?: string) {
    return this.stockService.getLowStockProducts(req.user.companyId, warehouseId);
  }

  @Post('transfer')
  @RequirePermission('products', 'update')
  transfer(@Req() req: any, @Body() body: any) {
    return this.stockService.transferStock({
      companyId: req.user.companyId,
      productId: body.productId,
      fromWarehouseId: body.fromWarehouseId,
      toWarehouseId: body.toWarehouseId,
      quantity: body.quantity,
      createdBy: req.user.userId,
    });
  }
}
