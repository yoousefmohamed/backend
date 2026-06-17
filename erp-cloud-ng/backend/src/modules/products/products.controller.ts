import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';

@ApiTags('products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @RequirePermission('products', 'view')
  findAll(@Req() req: any, @Query('search') search?: string, @Query('categoryId') categoryId?: string) {
    return this.productsService.findAll(req.user.companyId, search, categoryId);
  }

  @Get('barcode/:barcode')
  @RequirePermission('products', 'view')
  findByBarcode(@Req() req: any, @Param('barcode') barcode: string) {
    return this.productsService.findByBarcode(req.user.companyId, barcode);
  }

  @Get(':id')
  @RequirePermission('products', 'view')
  findOne(@Param('id') id: string) {
    return this.productsService.findById(id);
  }

  @Post()
  @RequirePermission('products', 'create')
  create(@Req() req: any, @Body() body: any) {
    return this.productsService.create({ ...body, companyId: req.user.companyId });
  }

  @Put(':id')
  @RequirePermission('products', 'update')
  update(@Param('id') id: string, @Body() body: any) {
    return this.productsService.update(id, body);
  }

  @Delete(':id')
  @RequirePermission('products', 'delete')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
