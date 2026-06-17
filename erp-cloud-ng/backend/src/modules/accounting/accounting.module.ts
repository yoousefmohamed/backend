import {
  Module,
  Injectable,
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { TypeOrmModule, InjectRepository } from '@nestjs/typeorm';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Repository,
  DataSource,
} from 'typeorm';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';

@Entity('chart_of_accounts')
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id' })
  companyId: string;

  @Column({ length: 20 })
  code: string;

  @Column({ length: 150 })
  name: string;

  @Column({ name: 'account_type', length: 30 })
  accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

  @Column({ name: 'parent_id', nullable: true })
  parentId: string;
}

@Entity('journal_entries')
export class JournalEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id' })
  companyId: string;

  @Column({ name: 'entry_date', type: 'date' })
  entryDate: Date;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @OneToMany(() => JournalEntryLine, (line) => line.entry, { cascade: true })
  lines: JournalEntryLine[];
}

@Entity('journal_entry_lines')
export class JournalEntryLine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'entry_id' })
  entryId: string;

  @Column({ name: 'account_id' })
  accountId: string;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  debit: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  credit: number;

  @ManyToOne(() => JournalEntry, (entry) => entry.lines)
  @JoinColumn({ name: 'entry_id' })
  entry: JournalEntry;
}

@Injectable()
export class AccountingService {
  constructor(
    @InjectRepository(Account) private readonly accountRepo: Repository<Account>,
    @InjectRepository(JournalEntry) private readonly entryRepo: Repository<JournalEntry>,
    @InjectRepository(JournalEntryLine) private readonly lineRepo: Repository<JournalEntryLine>,
    private readonly dataSource: DataSource,
  ) {}

  findAllAccounts(companyId: string) {
    return this.accountRepo.find({ where: { companyId }, order: { code: 'ASC' } });
  }

  createAccount(data: Partial<Account>) {
    return this.accountRepo.save(this.accountRepo.create(data));
  }

  async createJournalEntry(input: {
    companyId: string;
    entryDate: Date;
    description?: string;
    createdBy: string;
    lines: { accountId: string; debit: number; credit: number }[];
  }) {
    const totalDebit = input.lines.reduce((s, l) => s + (l.debit || 0), 0);
    const totalCredit = input.lines.reduce((s, l) => s + (l.credit || 0), 0);
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new BadRequestException('القيد غير متوازن: إجمالي المدين يجب أن يساوي إجمالي الدائن');
    }

    return this.dataSource.transaction(async (manager) => {
      const entry = manager.create(JournalEntry, {
        companyId: input.companyId,
        entryDate: input.entryDate,
        description: input.description,
        createdBy: input.createdBy,
      });
      const savedEntry = await manager.save(entry);

      const lines = input.lines.map((l) =>
        manager.create(JournalEntryLine, {
          entryId: savedEntry.id,
          accountId: l.accountId,
          debit: l.debit || 0,
          credit: l.credit || 0,
        }),
      );
      await manager.save(lines);
      savedEntry.lines = lines;
      return savedEntry;
    });
  }

  /** ميزان المراجعة: إجمالي مدين/دائن لكل حساب */
  async getTrialBalance(companyId: string) {
    return this.lineRepo
      .createQueryBuilder('l')
      .innerJoin('chart_of_accounts', 'a', 'a.id = l.account_id')
      .innerJoin('journal_entries', 'e', 'e.id = l.entry_id')
      .where('e.company_id = :companyId', { companyId })
      .select('a.code', 'code')
      .addSelect('a.name', 'name')
      .addSelect('a.account_type', 'accountType')
      .addSelect('COALESCE(SUM(l.debit), 0)', 'totalDebit')
      .addSelect('COALESCE(SUM(l.credit), 0)', 'totalCredit')
      .groupBy('a.code')
      .addGroupBy('a.name')
      .addGroupBy('a.account_type')
      .orderBy('a.code', 'ASC')
      .getRawMany();
  }

  /** قائمة الدخل: الإيرادات - المصروفات */
  async getIncomeStatement(companyId: string) {
    const balances = await this.getTrialBalance(companyId);
    const revenue = balances.filter((b) => b.accountType === 'revenue');
    const expense = balances.filter((b) => b.accountType === 'expense');

    const totalRevenue = revenue.reduce((s, b) => s + Number(b.totalCredit) - Number(b.totalDebit), 0);
    const totalExpense = expense.reduce((s, b) => s + Number(b.totalDebit) - Number(b.totalCredit), 0);

    return {
      revenue,
      expense,
      totalRevenue,
      totalExpense,
      netIncome: totalRevenue - totalExpense,
    };
  }

  /** الميزانية العمومية: الأصول = الخصوم + حقوق الملكية */
  async getBalanceSheet(companyId: string) {
    const balances = await this.getTrialBalance(companyId);
    const assets = balances.filter((b) => b.accountType === 'asset');
    const liabilities = balances.filter((b) => b.accountType === 'liability');
    const equity = balances.filter((b) => b.accountType === 'equity');

    const totalAssets = assets.reduce((s, b) => s + Number(b.totalDebit) - Number(b.totalCredit), 0);
    const totalLiabilities = liabilities.reduce((s, b) => s + Number(b.totalCredit) - Number(b.totalDebit), 0);
    const totalEquity = equity.reduce((s, b) => s + Number(b.totalCredit) - Number(b.totalDebit), 0);

    return { assets, liabilities, equity, totalAssets, totalLiabilities, totalEquity };
  }
}

@ApiTags('accounting')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('accounting')
export class AccountingController {
  constructor(private readonly service: AccountingService) {}

  @Get('accounts')
  @RequirePermission('reports', 'view')
  findAllAccounts(@Req() req: any) {
    return this.service.findAllAccounts(req.user.companyId);
  }

  @Post('accounts')
  @RequirePermission('reports', 'create')
  createAccount(@Req() req: any, @Body() body: any) {
    return this.service.createAccount({ ...body, companyId: req.user.companyId });
  }

  @Post('journal-entries')
  @RequirePermission('reports', 'create')
  createEntry(@Req() req: any, @Body() body: any) {
    return this.service.createJournalEntry({ ...body, companyId: req.user.companyId, createdBy: req.user.userId });
  }

  @Get('trial-balance')
  @RequirePermission('reports', 'view')
  trialBalance(@Req() req: any) {
    return this.service.getTrialBalance(req.user.companyId);
  }

  @Get('income-statement')
  @RequirePermission('reports', 'view')
  incomeStatement(@Req() req: any) {
    return this.service.getIncomeStatement(req.user.companyId);
  }

  @Get('balance-sheet')
  @RequirePermission('reports', 'view')
  balanceSheet(@Req() req: any) {
    return this.service.getBalanceSheet(req.user.companyId);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([Account, JournalEntry, JournalEntryLine])],
  providers: [AccountingService],
  controllers: [AccountingController],
  exports: [AccountingService],
})
export class AccountingModule {}
