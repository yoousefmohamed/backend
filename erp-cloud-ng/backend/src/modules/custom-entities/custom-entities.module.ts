import {
  Module,
  Injectable,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  NotFoundException,
} from '@nestjs/common';
import { TypeOrmModule, InjectRepository } from '@nestjs/typeorm';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Repository,
} from 'typeorm';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Entity('custom_entities')
export class CustomEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id' })
  companyId: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 100 })
  slug: string;

  @Column({ length: 50, nullable: true })
  icon: string;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => CustomField, (field) => field.entity, { cascade: true })
  fields: CustomField[];
}

@Entity('custom_fields')
export class CustomField {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'entity_id' })
  entityId: string;

  @Column({ name: 'field_name', length: 100 })
  fieldName: string;

  @Column({ name: 'field_type', length: 30 })
  fieldType: string; // text | number | date | select | checkbox | attachment | relation | computed

  @Column({ name: 'is_required', default: false })
  isRequired: boolean;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @Column({ type: 'jsonb', nullable: true })
  options: Record<string, any>;

  @ManyToOne(() => CustomEntity, (entity) => entity.fields)
  @JoinColumn({ name: 'entity_id' })
  entity: CustomEntity;
}

@Entity('custom_records')
export class CustomRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'entity_id' })
  entityId: string;

  @Column({ type: 'jsonb', default: {} })
  data: Record<string, any>;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Injectable()
export class CustomEntitiesService {
  constructor(
    @InjectRepository(CustomEntity) private readonly entityRepo: Repository<CustomEntity>,
    @InjectRepository(CustomField) private readonly fieldRepo: Repository<CustomField>,
    @InjectRepository(CustomRecord) private readonly recordRepo: Repository<CustomRecord>,
  ) {}

  findAllEntities(companyId: string) {
    return this.entityRepo.find({ where: { companyId }, relations: ['fields'], order: { createdAt: 'DESC' } });
  }

  async createEntity(data: { companyId: string; name: string; slug: string; icon?: string; createdBy: string }) {
    const entity = this.entityRepo.create(data);
    return this.entityRepo.save(entity);
  }

  async addField(entityId: string, data: Partial<CustomField>) {
    const field = this.fieldRepo.create({ ...data, entityId });
    return this.fieldRepo.save(field);
  }

  async removeField(fieldId: string) {
    await this.fieldRepo.delete(fieldId);
  }

  async getEntityBySlug(companyId: string, slug: string) {
    const entity = await this.entityRepo.findOne({ where: { companyId, slug }, relations: ['fields'] });
    if (!entity) throw new NotFoundException('الشاشة المخصصة غير موجودة');
    return entity;
  }

  findRecords(entityId: string) {
    return this.recordRepo.find({ where: { entityId }, order: { createdAt: 'DESC' } });
  }

  createRecord(entityId: string, data: Record<string, any>, createdBy: string) {
    const record = this.recordRepo.create({ entityId, data, createdBy });
    return this.recordRepo.save(record);
  }

  async updateRecord(id: string, data: Record<string, any>) {
    await this.recordRepo.update(id, { data });
    return this.recordRepo.findOne({ where: { id } });
  }

  removeRecord(id: string) {
    return this.recordRepo.delete(id);
  }
}

@ApiTags('app-builder')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('app-builder')
export class CustomEntitiesController {
  constructor(private readonly service: CustomEntitiesService) {}

  @Get('entities')
  findAllEntities(@Req() req: any) {
    return this.service.findAllEntities(req.user.companyId);
  }

  @Post('entities')
  createEntity(@Req() req: any, @Body() body: any) {
    return this.service.createEntity({ ...body, companyId: req.user.companyId, createdBy: req.user.userId });
  }

  @Post('entities/:entityId/fields')
  addField(@Param('entityId') entityId: string, @Body() body: any) {
    return this.service.addField(entityId, body);
  }

  @Delete('fields/:fieldId')
  removeField(@Param('fieldId') fieldId: string) {
    return this.service.removeField(fieldId);
  }

  @Get('entities/slug/:slug')
  getBySlug(@Req() req: any, @Param('slug') slug: string) {
    return this.service.getEntityBySlug(req.user.companyId, slug);
  }

  @Get('entities/:entityId/records')
  findRecords(@Param('entityId') entityId: string) {
    return this.service.findRecords(entityId);
  }

  @Post('entities/:entityId/records')
  createRecord(@Req() req: any, @Param('entityId') entityId: string, @Body('data') data: any) {
    return this.service.createRecord(entityId, data, req.user.userId);
  }

  @Put('records/:id')
  updateRecord(@Param('id') id: string, @Body('data') data: any) {
    return this.service.updateRecord(id, data);
  }

  @Delete('records/:id')
  removeRecord(@Param('id') id: string) {
    return this.service.removeRecord(id);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([CustomEntity, CustomField, CustomRecord])],
  providers: [CustomEntitiesService],
  controllers: [CustomEntitiesController],
  exports: [CustomEntitiesService],
})
export class CustomEntitiesModule {}
