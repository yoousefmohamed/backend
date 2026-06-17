import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { SalesModule } from '../sales/sales.module';
import { StockModule } from '../stock/stock.module';
import { TreasuryModule } from '../treasury/treasury.module';
import { PartnersModule } from '../partners/partners.module';

@Module({
  imports: [SalesModule, StockModule, TreasuryModule, PartnersModule],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}
