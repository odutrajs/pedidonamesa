import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Expense, Order } from '../entities';
import { InventoryModule } from '../inventory/inventory.module';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';

@Module({
  imports: [TypeOrmModule.forFeature([Order, Expense]), InventoryModule],
  controllers: [FinanceController],
  providers: [FinanceService],
})
export class FinanceModule {}
