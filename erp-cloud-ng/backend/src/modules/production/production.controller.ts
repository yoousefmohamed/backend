import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ProductionService } from './production.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';

@ApiTags('production')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('production')
export class ProductionController {
  constructor(private readonly productionService: ProductionService) {}

  @Get('orders')
  @RequirePermission('production', 'view')
  findAll(@Req() req: any) {
    return this.productionService.findAll(req.user.companyId);
  }

  @Get('bom/:productId')
  @RequirePermission('production', 'view')
  getBOM(@Param('productId') productId: string) {
    return this.productionService.getBOM(productId);
  }

  @Post('bom/:productId')
  @RequirePermission('production', 'update')
  setBOM(@Param('productId') productId: string, @Body('materials') materials: any[]) {
    return this.productionService.setBOM(productId, materials);
  }

  @Get('check-materials/:productId/:warehouseId/:quantity')
  @RequirePermission('production', 'view')
  checkMaterials(
    @Param('productId') productId: string,
    @Param('warehouseId') warehouseId: string,
    @Param('quantity') quantity: string,
  ) {
    return this.productionService.checkMaterialAvailability(productId, warehouseId, Number(quantity));
  }

  @Post('orders')
  @RequirePermission('production', 'create')
  createOrder(@Req() req: any, @Body() body: any) {
    return this.productionService.createOrder({
      ...body,
      companyId: req.user.companyId,
      createdBy: req.user.userId,
    });
  }

  @Post('orders/:id/complete')
  @RequirePermission('production', 'update')
  completeOrder(@Param('id') id: string, @Req() req: any) {
    return this.productionService.completeOrder(id, req.user.userId);
  }
}
