import { Module, Injectable, Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { TypeOrmModule, InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Role, Permission } from './role.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role) private readonly roleRepo: Repository<Role>,
    @InjectRepository(Permission) private readonly permissionRepo: Repository<Permission>,
  ) {}

  findAllRoles(companyId: string) {
    return this.roleRepo.find({
      where: { companyId },
      relations: ['permissions'],
      order: { name: 'ASC' },
    });
  }

  findAllPermissions() {
    return this.permissionRepo.find({ order: { module: 'ASC', action: 'ASC' } });
  }

  async createRole(data: { companyId: string; name: string; code: string }) {
    const role = this.roleRepo.create(data);
    return this.roleRepo.save(role);
  }

  /**
   * Replaces the full permission set for a role — matches the "toggle grid" UI
   * where the front-end sends the complete list of permission IDs that should be ON.
   */
  async setRolePermissions(roleId: string, permissionIds: string[]) {
    const role = await this.roleRepo.findOne({ where: { id: roleId }, relations: ['permissions'] });
    if (!role) return null;
    const allPermissions = await this.permissionRepo.find();
    role.permissions = allPermissions.filter((p) => permissionIds.includes(p.id));
    return this.roleRepo.save(role);
  }
}

@ApiTags('roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly service: RolesService) {}

  @Get()
  @RequirePermission('users', 'view')
  findAll(@Req() req: any) {
    return this.service.findAllRoles(req.user.companyId);
  }

  @Get('permissions-catalog')
  @RequirePermission('users', 'view')
  findAllPermissions() {
    return this.service.findAllPermissions();
  }

  @Post()
  @RequirePermission('users', 'create')
  create(@Req() req: any, @Body() body: any) {
    return this.service.createRole({ ...body, companyId: req.user.companyId });
  }

  @Post(':id/permissions')
  @RequirePermission('users', 'update')
  setPermissions(@Param('id') id: string, @Body('permissionIds') permissionIds: string[]) {
    return this.service.setRolePermissions(id, permissionIds);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([Role, Permission])],
  providers: [RolesService],
  controllers: [RolesController],
  exports: [RolesService],
})
export class RolesModule {}
