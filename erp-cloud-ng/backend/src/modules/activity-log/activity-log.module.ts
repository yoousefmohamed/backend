import { Module, Injectable, Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { TypeOrmModule, InjectRepository } from '@nestjs/typeorm';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Repository } from 'typeorm';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Entity('activity_logs')
export class ActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id' })
  companyId: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column({ length: 50 })
  action: string;

  @Column({ name: 'entity_type', length: 50, nullable: true })
  entityType: string;

  @Column({ name: 'entity_id', nullable: true })
  entityId: string;

  @Column({ type: 'jsonb', nullable: true })
  details: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

@Injectable()
export class ActivityLogService {
  constructor(@InjectRepository(ActivityLog) private readonly repo: Repository<ActivityLog>) {}

  log(data: Partial<ActivityLog>) {
    return this.repo.save(this.repo.create(data));
  }

  findAll(companyId: string, limit = 100) {
    return this.repo.find({ where: { companyId }, order: { createdAt: 'DESC' }, take: limit });
  }
}

@ApiTags('activity-log')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('activity-log')
export class ActivityLogController {
  constructor(private readonly service: ActivityLogService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.service.findAll(req.user.companyId);
  }

  @Post()
  log(@Req() req: any, @Body() body: any) {
    return this.service.log({ ...body, companyId: req.user.companyId, userId: req.user.userId });
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([ActivityLog])],
  providers: [ActivityLogService],
  controllers: [ActivityLogController],
  exports: [ActivityLogService],
})
export class ActivityLogModule {}
