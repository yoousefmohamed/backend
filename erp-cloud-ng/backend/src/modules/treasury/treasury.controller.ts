import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TreasuryService } from './treasury.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';

@ApiTags('treasury')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('treasury')
export class TreasuryController {
  constructor(private readonly treasuryService: TreasuryService) {}

  @Get()
  @RequirePermission('treasury', 'view')
  findAll(@Req() req: any) {
    return this.treasuryService.findAllByCompany(req.user.companyId);
  }

  @Get(':id/transactions')
  @RequirePermission('treasury', 'view')
  getTransactions(@Param('id') id: string) {
    return this.treasuryService.getTransactions(id);
  }

  @Post('transaction')
  @RequirePermission('treasury', 'create')
  recordTransaction(@Req() req: any, @Body() body: any) {
    return this.treasuryService.recordTransaction({ ...body, createdBy: req.user.userId });
  }
}
