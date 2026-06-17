import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PartnersService } from './partners.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';

@ApiTags('partners')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('partners')
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  @Get()
  @RequirePermission('customers', 'view')
  findAll(@Req() req: any, @Query('type') type?: 'customer' | 'supplier') {
    return this.partnersService.findAll(req.user.companyId, type);
  }

  @Get(':id')
  @RequirePermission('customers', 'view')
  findOne(@Param('id') id: string) {
    return this.partnersService.findById(id);
  }

  @Get(':id/statement')
  @RequirePermission('customers', 'reports')
  getStatement(@Param('id') id: string) {
    return this.partnersService.getStatement(id);
  }

  @Post()
  @RequirePermission('customers', 'create')
  create(@Req() req: any, @Body() body: any) {
    return this.partnersService.create({ ...body, companyId: req.user.companyId });
  }

  @Put(':id')
  @RequirePermission('customers', 'update')
  update(@Param('id') id: string, @Body() body: any) {
    return this.partnersService.update(id, body);
  }
}
