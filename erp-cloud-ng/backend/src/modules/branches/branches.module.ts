import { Module, Injectable, Controller, Get, Post, Put, Body, Param, UseGuards, Req } from '@nestjs/common';
import { TypeOrmModule, InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Branch } from './branch.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Injectable()
export class BranchesService {
  constructor(@InjectRepository(Branch) private readonly repo: Repository<Branch>) {}

  findAll(companyId: string) {
    return this.repo.find({ where: { companyId, isActive: true } });
  }

  findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  create(data: Partial<Branch>) {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: string, data: Partial<Branch>) {
    await this.repo.update(id, data);
    return this.repo.findOne({ where: { id } });
  }
}

@ApiTags('branches')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('branches')
export class BranchesController {
  constructor(private readonly service: BranchesService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.service.findAll(req.user.companyId);
  }

  @Post()
  create(@Req() req: any, @Body() body: any) {
    return this.service.create({ ...body, companyId: req.user.companyId });
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([Branch])],
  providers: [BranchesService],
  controllers: [BranchesController],
  exports: [BranchesService],
})
export class BranchesModule {}
