import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Partner, PartnerTransaction } from './partner.entity';

interface AdjustBalanceInput {
  partnerId: string;
  amountDelta: number;
  transactionType: string;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
}

@Injectable()
export class PartnersService {
  constructor(
    @InjectRepository(Partner) private readonly partnerRepo: Repository<Partner>,
    @InjectRepository(PartnerTransaction)
    private readonly transactionRepo: Repository<PartnerTransaction>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(companyId: string, partnerType?: 'customer' | 'supplier') {
    const where: any = { companyId, isActive: true };
    if (partnerType) where.partnerType = partnerType;
    return this.partnerRepo.find({ where, order: { name: 'ASC' } });
  }

  async findById(id: string): Promise<Partner> {
    const partner = await this.partnerRepo.findOne({ where: { id } });
    if (!partner) throw new NotFoundException('العميل/المورد غير موجود');
    return partner;
  }

  async create(data: Partial<Partner>): Promise<Partner> {
    const partner = this.partnerRepo.create(data);
    return this.partnerRepo.save(partner);
  }

  async update(id: string, data: Partial<Partner>): Promise<Partner> {
    await this.partnerRepo.update(id, data);
    return this.findById(id);
  }

  async adjustBalance(input: AdjustBalanceInput): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const partner = await manager.findOne(Partner, { where: { id: input.partnerId } });
      if (!partner) throw new NotFoundException('العميل/المورد غير موجود');

      partner.currentBalance = Number(partner.currentBalance) + input.amountDelta;
      await manager.save(partner);

      const transaction = manager.create(PartnerTransaction, {
        partnerId: input.partnerId,
        transactionType: input.transactionType,
        amount: input.amountDelta,
        referenceType: input.referenceType,
        referenceId: input.referenceId,
        notes: input.notes,
      });
      await manager.save(transaction);
    });
  }

  async getStatement(partnerId: string) {
    return this.transactionRepo.find({
      where: { partnerId },
      order: { createdAt: 'DESC' },
    });
  }

  async getOverdueCustomers(companyId: string) {
    return this.partnerRepo.find({
      where: { companyId, partnerType: 'customer' },
      order: { currentBalance: 'DESC' },
    });
  }
}
