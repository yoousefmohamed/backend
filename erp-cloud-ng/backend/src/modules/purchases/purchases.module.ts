import { Module, Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PurchaseInvoice, PurchaseInvoiceItem } from './purchase-invoice.entity';
import { PurchasesService } from './purchases.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { StockModule } from '../stock/stock.module';
import { PartnersModule } from '../partners/partners.module';

@ApiTags('purchases')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('purchases')
export class PurchasesController {
  constructor(private readonly service: PurchasesService) {}

  @Get()
  @RequirePermission('purchases', 'view')
  findAll(@Req() req: any) {
    return this.service.findAll(req.user.companyId);
  }

  @Post()
  @RequirePermission('purchases', 'create')
  create(@Req() req: any, @Body() body: any) {
    return this.service.createInvoice({ ...body, companyId: req.user.companyId, createdBy: req.user.userId });
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([PurchaseInvoice, PurchaseInvoiceItem]), StockModule, PartnersModule],
  providers: [PurchasesService],
  controllers: [PurchasesController],
  exports: [PurchasesService],
})
export class PurchasesModule {}
