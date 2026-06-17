import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import databaseConfig from './config/database.config';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { BranchesModule } from './modules/branches/branches.module';
import { RolesModule } from './modules/roles/roles.module';
import { ProductsModule } from './modules/products/products.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { WarehousesModule } from './modules/warehouses/warehouses.module';
import { StockModule } from './modules/stock/stock.module';
import { PartnersModule } from './modules/partners/partners.module';
import { SalesModule } from './modules/sales/sales.module';
import { PurchasesModule } from './modules/purchases/purchases.module';
import { ProductionModule } from './modules/production/production.module';
import { TreasuryModule } from './modules/treasury/treasury.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { AccountingModule } from './modules/accounting/accounting.module';
import { ReportsModule } from './modules/reports/reports.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ActivityLogModule } from './modules/activity-log/activity-log.module';
import { CustomEntitiesModule } from './modules/custom-entities/custom-entities.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { RealtimeModule } from './modules/realtime/realtime.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    TypeOrmModule.forRootAsync({
      useFactory: databaseConfig,
    }),

    // Core / identity
    AuthModule,
    UsersModule,
    CompaniesModule,
    BranchesModule,
    RolesModule,

    // Inventory
    ProductsModule,
    CategoriesModule,
    WarehousesModule,
    StockModule,

    // Commerce
    PartnersModule,
    SalesModule,
    PurchasesModule,

    // Manufacturing
    ProductionModule,

    // Finance
    TreasuryModule,
    ExpensesModule,
    AccountingModule,

    // Insight & ops
    ReportsModule,
    NotificationsModule,
    ActivityLogModule,
    DashboardModule,

    // Platform
    CustomEntitiesModule,
    RealtimeModule,
  ],
})
export class AppModule {}
