import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillOfMaterial, ProductionOrder } from './production.entity';
import { ProductionService } from './production.service';
import { ProductionController } from './production.controller';
import { StockModule } from '../stock/stock.module';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [TypeOrmModule.forFeature([BillOfMaterial, ProductionOrder]), StockModule, ProductsModule],
  providers: [ProductionService],
  controllers: [ProductionController],
  exports: [ProductionService],
})
export class ProductionModule {}
