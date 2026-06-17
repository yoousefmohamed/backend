import { Module, Injectable, Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';

@Injectable()
export class ReportsService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async salesReport(companyId: string, from?: string, to?: string) {
    const fromDate = from || '1900-01-01';
    const toDate = to || '2999-12-31';
    return this.dataSource.query(
      `SELECT date_trunc('day', created_at) AS day,
              COUNT(*) AS invoice_count,
              SUM(total_amount) AS total_sales,
              SUM(paid_amount) AS total_paid
       FROM sales_invoices
       WHERE company_id = $1 AND created_at::date BETWEEN $2 AND $3
       GROUP BY day ORDER BY day ASC`,
      [companyId, fromDate, toDate],
    );
  }

  async purchasesReport(companyId: string, from?: string, to?: string) {
    const fromDate = from || '1900-01-01';
    const toDate = to || '2999-12-31';
    return this.dataSource.query(
      `SELECT date_trunc('day', created_at) AS day,
              COUNT(*) AS invoice_count,
              SUM(total_amount) AS total_purchases
       FROM purchase_invoices
       WHERE company_id = $1 AND created_at::date BETWEEN $2 AND $3
       GROUP BY day ORDER BY day ASC`,
      [companyId, fromDate, toDate],
    );
  }

  async profitLossReport(companyId: string, from?: string, to?: string) {
    const fromDate = from || '1900-01-01';
    const toDate = to || '2999-12-31';
    const rows = await this.dataSource.query(
      `SELECT si.id, sii.quantity, sii.unit_price, p.cost_price
       FROM sales_invoice_items sii
       JOIN sales_invoices si ON si.id = sii.invoice_id
       JOIN products p ON p.id = sii.product_id
       WHERE si.company_id = $1 AND si.created_at::date BETWEEN $2 AND $3`,
      [companyId, fromDate, toDate],
    );

    let revenue = 0;
    let cost = 0;
    for (const r of rows) {
      revenue += Number(r.quantity) * Number(r.unit_price);
      cost += Number(r.quantity) * Number(r.cost_price);
    }
    const expenses = await this.dataSource.query(
      `SELECT COALESCE(SUM(amount),0) AS total FROM expenses
       WHERE company_id = $1 AND expense_date BETWEEN $2 AND $3`,
      [companyId, fromDate, toDate],
    );
    const totalExpenses = Number(expenses[0]?.total || 0);

    return {
      revenue,
      costOfGoodsSold: cost,
      grossProfit: revenue - cost,
      operatingExpenses: totalExpenses,
      netProfit: revenue - cost - totalExpenses,
    };
  }

  async inventoryReport(companyId: string) {
    return this.dataSource.query(
      `SELECT p.name, p.barcode, p.sale_price, p.cost_price, p.min_stock_level,
              COALESCE(SUM(sl.quantity), 0) AS total_quantity
       FROM products p
       LEFT JOIN stock_levels sl ON sl.product_id = p.id
       WHERE p.company_id = $1 AND p.is_active = true
       GROUP BY p.id, p.name, p.barcode, p.sale_price, p.cost_price, p.min_stock_level
       ORDER BY p.name ASC`,
      [companyId],
    );
  }

  async customersStatementReport(companyId: string) {
    return this.dataSource.query(
      `SELECT name, phone, credit_limit, current_balance
       FROM partners
       WHERE company_id = $1 AND partner_type = 'customer' AND is_active = true
       ORDER BY current_balance DESC`,
      [companyId],
    );
  }

  async productionReport(companyId: string, from?: string, to?: string) {
    const fromDate = from || '1900-01-01';
    const toDate = to || '2999-12-31';
    return this.dataSource.query(
      `SELECT po.order_number, p.name AS product_name, po.quantity_planned,
              po.quantity_produced, po.total_material_cost, po.status, po.created_at
       FROM production_orders po
       JOIN products p ON p.id = po.product_id
       WHERE po.company_id = $1 AND po.created_at::date BETWEEN $2 AND $3
       ORDER BY po.created_at DESC`,
      [companyId, fromDate, toDate],
    );
  }
}

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('sales')
  @RequirePermission('sales', 'reports')
  sales(@Req() req: any, @Query('from') from?: string, @Query('to') to?: string) {
    return this.service.salesReport(req.user.companyId, from, to);
  }

  @Get('purchases')
  @RequirePermission('purchases', 'reports')
  purchases(@Req() req: any, @Query('from') from?: string, @Query('to') to?: string) {
    return this.service.purchasesReport(req.user.companyId, from, to);
  }

  @Get('profit-loss')
  @RequirePermission('reports', 'view')
  profitLoss(@Req() req: any, @Query('from') from?: string, @Query('to') to?: string) {
    return this.service.profitLossReport(req.user.companyId, from, to);
  }

  @Get('inventory')
  @RequirePermission('products', 'reports')
  inventory(@Req() req: any) {
    return this.service.inventoryReport(req.user.companyId);
  }

  @Get('customers-statement')
  @RequirePermission('customers', 'reports')
  customersStatement(@Req() req: any) {
    return this.service.customersStatementReport(req.user.companyId);
  }

  @Get('production')
  @RequirePermission('production', 'reports')
  production(@Req() req: any, @Query('from') from?: string, @Query('to') to?: string) {
    return this.service.productionReport(req.user.companyId, from, to);
  }
}

@Module({
  providers: [ReportsService],
  controllers: [ReportsController],
})
export class ReportsModule {}
