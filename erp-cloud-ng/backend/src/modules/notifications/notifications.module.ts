import { Module, Injectable, Controller, Get, Post, Put, Body, Param, UseGuards, Req } from '@nestjs/common';
import { TypeOrmModule, InjectRepository } from '@nestjs/typeorm';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Repository } from 'typeorm';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RealtimeModule } from '../realtime/realtime.module';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id' })
  companyId: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column({ length: 150 })
  title: string;

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({ name: 'notif_type', length: 30, default: 'info' })
  notifType: string;

  @Column({ name: 'is_read', default: false })
  isRead: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification) private readonly repo: Repository<Notification>,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  findAll(companyId: string, userId?: string) {
    const where: any = { companyId };
    if (userId) where.userId = userId;
    return this.repo.find({ where, order: { createdAt: 'DESC' }, take: 100 });
  }

  async create(data: Partial<Notification>) {
    const notif = await this.repo.save(this.repo.create(data));
    this.realtimeGateway.emitToCompany(data.companyId, 'notification:new', notif);
    return notif;
  }

  async markRead(id: string) {
    await this.repo.update(id, { isRead: true });
    return this.repo.findOne({ where: { id } });
  }

  unreadCount(companyId: string, userId: string) {
    return this.repo.count({ where: { companyId, userId, isRead: false } });
  }
}

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.service.findAll(req.user.companyId, req.user.userId);
  }

  @Get('unread-count')
  unreadCount(@Req() req: any) {
    return this.service.unreadCount(req.user.companyId, req.user.userId);
  }

  @Put(':id/read')
  markRead(@Param('id') id: string) {
    return this.service.markRead(id);
  }

  @Post()
  create(@Req() req: any, @Body() body: any) {
    return this.service.create({ ...body, companyId: req.user.companyId });
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([Notification]), RealtimeModule],
  providers: [NotificationsService],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
