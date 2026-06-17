import { Injectable } from '@nestjs/common';
import { SalesService } from '../sales/sales.service';
import { StockService } from '../stock/stock.service';
import { TreasuryService } from '../treasury/treasury.service';
import { PartnersService } from '../partners/partners.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly salesService: SalesService,
    private readonly stockService: StockService,
    private readonly treasuryService: TreasuryService,
    private readonly partnersService: PartnersService,
  ) {}

  async getSummary(companyId: string) {
    const [todaySales, treasuryBalance, lowStock, customers] = await Promise.all([
      this.salesService.getTodaySummary(companyId),
      this.treasuryService.getTotalBalance(companyId),
      this.stockService.getLowStockProducts(companyId),
      this.partnersService.getOverdueCustomers(companyId),
    ]);

    const totalDebt = customers.reduce((sum, c) => sum + Number(c.currentBalance), 0);

    return {
      todaySales: todaySales.totalSales,
      todayInvoiceCount: todaySales.invoiceCount,
      treasuryBalance,
      lowStockCount: lowStock.length,
      lowStockItems: lowStock.slice(0, 10),
      totalCustomerDebt: totalDebt,
      topDebtors: customers.filter((c) => Number(c.currentBalance) > 0).slice(0, 5),
    };
  }
}
