import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Treasury, TreasuryTransaction } from './treasury.entity';

interface RecordTransactionInput {
  treasuryId: string;
  transactionType: 'in' | 'out';
  amount: number;
  description?: string;
  referenceType?: string;
  referenceId?: string;
  createdBy?: string;
}

@Injectable()
export class TreasuryService {
  constructor(
    @InjectRepository(Treasury) private readonly treasuryRepo: Repository<Treasury>,
    @InjectRepository(TreasuryTransaction)
    private readonly transactionRepo: Repository<TreasuryTransaction>,
    private readonly dataSource: DataSource,
  ) {}

  async findAllByCompany(companyId: string) {
    return this.treasuryRepo.find({ where: { companyId, isActive: true } });
  }

  async recordTransaction(input: RecordTransactionInput): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const treasury = await manager.findOne(Treasury, { where: { id: input.treasuryId } });
      if (!treasury) throw new NotFoundException('الخزنة غير موجودة');

      const delta = input.transactionType === 'in' ? input.amount : -input.amount;
      const newBalance = Number(treasury.currentBalance) + delta;

      if (newBalance < 0) {
        throw new BadRequestException('الرصيد غير كافٍ لإتمام هذه العملية');
      }

      treasury.currentBalance = newBalance;
      await manager.save(treasury);

      const transaction = manager.create(TreasuryTransaction, {
        treasuryId: input.treasuryId,
        transactionType: input.transactionType,
        amount: input.amount,
        description: input.description,
        referenceType: input.referenceType,
        referenceId: input.referenceId,
        createdBy: input.createdBy,
      });
      await manager.save(transaction);
    });
  }

  async getTransactions(treasuryId: string, limit = 50) {
    return this.transactionRepo.find({
      where: { treasuryId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getTotalBalance(companyId: string): Promise<number> {
    const result = await this.treasuryRepo
      .createQueryBuilder('t')
      .where('t.company_id = :companyId', { companyId })
      .select('COALESCE(SUM(t.current_balance), 0)', 'total')
      .getRawOne();
    return Number(result.total);
  }
}
