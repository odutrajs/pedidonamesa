import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Ingredient,
  InventoryCount,
  Order,
  OrderItem,
  Product,
  ProductIngredient,
  StockMovement,
} from '../entities';
import { RestaurantFeaturesModule } from '../restaurant-features/restaurant-features.module';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Ingredient,
      ProductIngredient,
      StockMovement,
      InventoryCount,
      Product,
      Order,
      OrderItem,
    ]),
    RestaurantFeaturesModule,
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
