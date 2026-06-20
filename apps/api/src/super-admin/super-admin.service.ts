import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import {
  CreateRestaurantInput,
  RestaurantDetailDto,
  RestaurantSummaryDto,
  RestaurantUserDto,
  UpdateRestaurantInput,
  UserRole,
} from '@pedidonamesa/shared';
import { Restaurant, User } from '../entities';
import { CreateRestaurantUserDto } from './dto/super-admin.dto';

@Injectable()
export class SuperAdminService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurantsRepo: Repository<Restaurant>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async listRestaurants(): Promise<RestaurantSummaryDto[]> {
    const restaurants = await this.restaurantsRepo.find({ order: { createdAt: 'DESC' } });
    const counts = await this.usersRepo
      .createQueryBuilder('user')
      .select('user.restaurantId', 'restaurantId')
      .addSelect('COUNT(*)', 'count')
      .where('user.restaurantId IS NOT NULL')
      .groupBy('user.restaurantId')
      .getRawMany<{ restaurantId: string; count: string }>();

    const countMap = new Map(counts.map((row) => [row.restaurantId, Number(row.count)]));

    return restaurants.map((restaurant) => this.toSummary(restaurant, countMap.get(restaurant.id) ?? 0));
  }

  async getRestaurant(id: string): Promise<RestaurantDetailDto> {
    const restaurant = await this.restaurantsRepo.findOne({ where: { id } });
    if (!restaurant) throw new NotFoundException('Restaurante não encontrado');

    const userCount = await this.usersRepo.count({ where: { restaurantId: id } });
    return this.toDetail(restaurant, userCount);
  }

  async createRestaurant(input: CreateRestaurantInput): Promise<RestaurantDetailDto> {
    const slugTaken = await this.restaurantsRepo.findOne({ where: { slug: input.slug } });
    if (slugTaken) throw new ConflictException('Slug já está em uso');

    const emailTaken = await this.usersRepo.findOne({ where: { email: input.adminEmail } });
    if (emailTaken) throw new ConflictException('E-mail de admin já está em uso');

    const restaurant = await this.restaurantsRepo.save(
      this.restaurantsRepo.create({
        name: input.name,
        slug: input.slug,
        description: input.description ?? null,
        active: input.active ?? true,
        inventoryEnabled: input.inventoryEnabled ?? true,
        financeEnabled: input.financeEnabled ?? true,
        whatsappEnabled: input.whatsappEnabled ?? true,
        deliveryEnabled: input.deliveryEnabled ?? true,
      }),
    );

    const passwordHash = await bcrypt.hash(input.adminPassword, 10);
    await this.usersRepo.save(
      this.usersRepo.create({
        name: input.adminName,
        email: input.adminEmail,
        passwordHash,
        role: UserRole.ADMIN,
        restaurantId: restaurant.id,
      }),
    );

    return this.getRestaurant(restaurant.id);
  }

  async updateRestaurant(id: string, input: UpdateRestaurantInput): Promise<RestaurantDetailDto> {
    const restaurant = await this.restaurantsRepo.findOne({ where: { id } });
    if (!restaurant) throw new NotFoundException('Restaurante não encontrado');

    if (input.slug !== undefined && input.slug !== restaurant.slug) {
      const slugTaken = await this.restaurantsRepo.findOne({ where: { slug: input.slug } });
      if (slugTaken) throw new ConflictException('Slug já está em uso');
      restaurant.slug = input.slug;
    }

    if (input.name !== undefined) restaurant.name = input.name;
    if (input.description !== undefined) restaurant.description = input.description;
    if (input.active !== undefined) restaurant.active = input.active;
    if (input.inventoryEnabled !== undefined) restaurant.inventoryEnabled = input.inventoryEnabled;
    if (input.financeEnabled !== undefined) restaurant.financeEnabled = input.financeEnabled;
    if (input.whatsappEnabled !== undefined) restaurant.whatsappEnabled = input.whatsappEnabled;
    if (input.deliveryEnabled !== undefined) restaurant.deliveryEnabled = input.deliveryEnabled;
    if (input.paymentMode !== undefined) restaurant.paymentMode = input.paymentMode;
    if (input.whatsappBotEnabled !== undefined) restaurant.whatsappBotEnabled = input.whatsappBotEnabled;

    await this.restaurantsRepo.save(restaurant);
    return this.getRestaurant(id);
  }

  async listRestaurantUsers(restaurantId: string): Promise<RestaurantUserDto[]> {
    await this.assertRestaurant(restaurantId);
    const users = await this.usersRepo.find({
      where: { restaurantId },
      order: { createdAt: 'ASC' },
    });

    return users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    }));
  }

  async createRestaurantUser(
    restaurantId: string,
    dto: CreateRestaurantUserDto,
  ): Promise<RestaurantUserDto> {
    await this.assertRestaurant(restaurantId);

    if (dto.role === UserRole.SUPER_ADMIN) {
      throw new BadRequestException('Não é possível criar super admin por restaurante');
    }

    const emailTaken = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (emailTaken) throw new ConflictException('E-mail já está em uso');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersRepo.save(
      this.usersRepo.create({
        name: dto.name,
        email: dto.email,
        passwordHash,
        role: dto.role,
        restaurantId,
      }),
    );

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    };
  }

  private async assertRestaurant(id: string): Promise<Restaurant> {
    const restaurant = await this.restaurantsRepo.findOne({ where: { id } });
    if (!restaurant) throw new NotFoundException('Restaurante não encontrado');
    return restaurant;
  }

  private toSummary(restaurant: Restaurant, userCount: number): RestaurantSummaryDto {
    return {
      id: restaurant.id,
      name: restaurant.name,
      slug: restaurant.slug,
      description: restaurant.description,
      active: restaurant.active,
      inventoryEnabled: restaurant.inventoryEnabled,
      financeEnabled: restaurant.financeEnabled,
      whatsappEnabled: restaurant.whatsappEnabled,
      deliveryEnabled: restaurant.deliveryEnabled,
      userCount,
      createdAt: restaurant.createdAt.toISOString(),
      updatedAt: restaurant.updatedAt.toISOString(),
    };
  }

  private toDetail(restaurant: Restaurant, userCount: number): RestaurantDetailDto {
    return {
      ...this.toSummary(restaurant, userCount),
      paymentMode: restaurant.paymentMode,
      whatsappBotEnabled: restaurant.whatsappBotEnabled,
    };
  }
}
