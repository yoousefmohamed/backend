import { Module, Injectable, Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { TypeOrmModule, InjectRepository } from '@nestjs/typeorm';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Repository } from 'typeorm';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { TreasuryModule } from '../treasury/treasury.module';
import { TreasuryService } from '../treasury/treasury.service';

@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id' })
  companyId: string;

  @Column({ name: 'treasury_id', nullable: true })
  treasuryId: string;

  @Column({ length: 80, nullable: true })
  category: string;

  @Column({ length: 255, nullable: true })
  description: string;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  amount: number;

  @Column({ name: 'expense_date', type: 'date' })
  expenseDate: Date;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense) private readonly repo: Repository<Expense>,
    private readonly treasuryService: TreasuryService,
  ) {}

  findAll(companyId: string) {
    return this.repo.find({ where: { companyId }, order: { createdAt: 'DESC' } });
  }

  async create(data: Partial<Expense> & { treasuryId?: string }) {
    const expense = await this.repo.save(this.repo.create(data));
    if (data.treasuryId) {
      await this.treasuryService.recordTransaction({
        treasuryId: data.treasuryId,
        transactionType: 'out',
        amount: Number(data.amount),
        description: `مصروف: ${data.description || data.category}`,
        referenceType: 'expense',
        referenceId: expense.id,
        createdBy: data.createdBy,
      });
    }
    return expense;
  }
}

@ApiTags('expenses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly service: ExpensesService) {}

  @Get()
  @RequirePermission('treasury', 'view')
  findAll(@Req() req: any) {
    return this.service.findAll(req.user.companyId);
  }

  @Post()
  @RequirePermission('treasury', 'create')
  create(@Req() req: any, @Body() body: any) {
    return this.service.create({ ...body, companyId: req.user.companyId, createdBy: req.user.userId });
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([Expense]), TreasuryModule],
  providers: [ExpensesService],
  controllers: [ExpensesController],
  exports: [ExpensesService],
})
export class ExpensesModule {}
