import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermission('users', 'view')
  findAll(@Req() req: any) {
    return this.usersService.findAllByCompany(req.user.companyId);
  }

  @Get(':id')
  @RequirePermission('users', 'view')
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Post()
  @RequirePermission('users', 'create')
  create(@Req() req: any, @Body() body: any) {
    return this.usersService.create({ ...body, companyId: req.user.companyId });
  }

  @Put(':id')
  @RequirePermission('users', 'update')
  update(@Param('id') id: string, @Body() body: any) {
    return this.usersService.update(id, body);
  }

  @Delete(':id')
  @RequirePermission('users', 'delete')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
