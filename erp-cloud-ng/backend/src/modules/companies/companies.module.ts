import { Module, Injectable, Controller, Get, Post, Put, Body, Param, UseGuards, Req } from '@nestjs/common';
import { TypeOrmModule, InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Company } from './company.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Injectable()
export class CompaniesService {
  constructor(@InjectRepository(Company) private readonly repo: Repository<Company>) {}

  findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  create(data: Partial<Company>) {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: string, data: Partial<Company>) {
    await this.repo.update(id, data);
    return this.repo.findOne({ where: { id } });
  }
}

@ApiTags('companies')
@Controller('companies')
export class CompaniesController {
  constructor(private readonly service: CompaniesService) {}

  @Post('register')
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([Company])],
  providers: [CompaniesService],
  controllers: [CompaniesController],
  exports: [CompaniesService],
})
export class CompaniesModule {}
