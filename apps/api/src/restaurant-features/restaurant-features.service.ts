import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Restaurant } from '../entities';

@Injectable()
export class RestaurantFeaturesService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurantsRepo: Repository<Restaurant>,
  ) {}

  async getRestaurant(restaurantId: string): Promise<Restaurant> {
    const restaurant = await this.restaurantsRepo.findOne({ where: { id: restaurantId } });
    if (!restaurant) throw new NotFoundException('Restaurante não encontrado');
    return restaurant;
  }

  async assertInventoryEnabled(restaurantId: string): Promise<void> {
    const restaurant = await this.getRestaurant(restaurantId);
    if (!restaurant.inventoryEnabled) {
      throw new ForbiddenException('Funcionalidade de estoque/CMV não habilitada para este restaurante');
    }
  }

  async assertFinanceEnabled(restaurantId: string): Promise<void> {
    const restaurant = await this.getRestaurant(restaurantId);
    if (!restaurant.financeEnabled) {
      throw new ForbiddenException('Funcionalidade financeira não habilitada para este restaurante');
    }
  }

  async isInventoryEnabled(restaurantId: string): Promise<boolean> {
    const restaurant = await this.getRestaurant(restaurantId);
    return restaurant.inventoryEnabled;
  }
}
