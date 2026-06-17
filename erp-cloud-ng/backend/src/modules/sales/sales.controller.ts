import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SalesService } from './sales.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';

@ApiTags('sales')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get()
  @RequirePermission('sales', 'view')
  findAll(@Req() req: any) {
    return this.salesService.findAll(req.user.companyId);
  }

  @Get('today-summary')
  @RequirePermission('sales', 'view')
  todaySummary(@Req() req: any) {
    return this.salesService.getTodaySummary(req.user.companyId);
  }

  @Get(':id')
  @RequirePermission('sales', 'view')
  findOne(@Param('id') id: string) {
    return this.salesService.findById(id);
  }

  @Post()
  @RequirePermission('sales', 'create')
  create(@Req() req: any, @Body() body: any) {
    return this.salesService.createInvoice({
      ...body,
      companyId: req.user.companyId,
      branchId: req.user.branchId,
      createdBy: req.user.userId,
    });
  }
}
