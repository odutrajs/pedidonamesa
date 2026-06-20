import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category, Product, ProductSuggestion, Restaurant, Table } from '../entities';
import { StorageModule } from '../storage/storage.module';
import { OrdersModule } from '../orders/orders.module';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { WhatsAppBridgeService } from './whatsapp-bridge.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Category, Product, ProductSuggestion, Table, Restaurant]),
    StorageModule,
    OrdersModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, WhatsAppBridgeService],
})
export class AdminModule {}
