import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Treasury, TreasuryTransaction } from './treasury.entity';
import { TreasuryService } from './treasury.service';
import { TreasuryController } from './treasury.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Treasury, TreasuryTransaction])],
  providers: [TreasuryService],
  controllers: [TreasuryController],
  exports: [TreasuryService],
})
export class TreasuryModule {}
