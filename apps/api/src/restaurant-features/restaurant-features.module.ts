import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant } from '../entities';
import { RestaurantFeaturesService } from './restaurant-features.service';

@Module({
  imports: [TypeOrmModule.forFeature([Restaurant])],
  providers: [RestaurantFeaturesService],
  exports: [RestaurantFeaturesService],
})
export class RestaurantFeaturesModule {}
