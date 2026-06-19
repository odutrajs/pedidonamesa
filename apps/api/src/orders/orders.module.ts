import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order, OrderItem, Table, Product, Restaurant } from '../entities';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, Table, Restaurant, Product]),
    forwardRef(() => WebsocketModule),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
