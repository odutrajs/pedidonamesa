import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant, Category, Product, Order } from '../entities';
import { BotService } from './bot.service';
import { BotController } from './bot.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Restaurant, Category, Product, Order])],
  controllers: [BotController],
  providers: [BotService],
  exports: [BotService],
})
export class BotModule {}
