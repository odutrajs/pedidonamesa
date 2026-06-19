import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category, Product, Table } from '../entities';
import { StorageModule } from '../storage/storage.module';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Category, Product, Table]), StorageModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
