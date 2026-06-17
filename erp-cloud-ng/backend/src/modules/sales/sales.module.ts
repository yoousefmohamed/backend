import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesInvoice, SalesInvoiceItem } from './sales-invoice.entity';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { StockModule } from '../stock/stock.module';
import { TreasuryModule } from '../treasury/treasury.module';
import { PartnersModule } from '../partners/partners.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SalesInvoice, SalesInvoiceItem]),
    StockModule,
    TreasuryModule,
    PartnersModule,
    RealtimeModule,
  ],
  providers: [SalesService],
  controllers: [SalesController],
  exports: [SalesService],
})
export class SalesModule {}
