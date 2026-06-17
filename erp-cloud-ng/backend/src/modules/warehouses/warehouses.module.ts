import { Module, Injectable, Controller, Get, Post, Put, Body, Param, UseGuards, Req } from '@nestjs/common';
import { TypeOrmModule, InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Warehouse } from './warehouse.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';

@Injectable()
export class WarehousesService {
  constructor(@InjectRepository(Warehouse) private readonly repo: Repository<Warehouse>) {}

  findAll(companyId: string) {
    return this.repo.find({ where: { companyId, isActive: true } });
  }

  create(data: Partial<Warehouse>) {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: string, data: Partial<Warehouse>) {
    await this.repo.update(id, data);
    return this.repo.findOne({ where: { id } });
  }
}

@ApiTags('warehouses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('warehouses')
export class WarehousesController {
  constructor(private readonly service: WarehousesService) {}

  @Get()
  @RequirePermission('products', 'view')
  findAll(@Req() req: any) {
    return this.service.findAll(req.user.companyId);
  }

  @Post()
  @RequirePermission('products', 'create')
  create(@Req() req: any, @Body() body: any) {
    return this.service.create({ ...body, companyId: req.user.companyId });
  }

  @Put(':id')
  @RequirePermission('products', 'update')
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([Warehouse])],
  providers: [WarehousesService],
  controllers: [WarehousesController],
  exports: [WarehousesService],
})
export class WarehousesModule {}
