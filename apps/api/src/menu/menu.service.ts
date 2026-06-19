import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  CategoryDto,
  isProductOnChannel,
  MenuChannel,
  MenuDto,
  parseProductChannels,
  ProductDto,
} from '@pedidonamesa/shared';
import { Table } from '../entities/table.entity';
import { Category } from '../entities/category.entity';
import { Product } from '../entities/product.entity';
import { ProductSuggestion } from '../entities/product-suggestion.entity';
import { Restaurant } from '../entities/restaurant.entity';

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(Table)
    private readonly tablesRepo: Repository<Table>,
    @InjectRepository(Restaurant)
    private readonly restaurantsRepo: Repository<Restaurant>,
    @InjectRepository(Category)
    private readonly categoriesRepo: Repository<Category>,
    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,
    @InjectRepository(ProductSuggestion)
    private readonly suggestionsRepo: Repository<ProductSuggestion>,
  ) {}

  async getMenuByTableToken(token: string): Promise<MenuDto> {
    const table = await this.tablesRepo.findOne({
      where: { token, active: true },
      relations: ['restaurant'],
    });

    if (!table) {
      throw new NotFoundException('Mesa não encontrada');
    }

    return this.buildMenu(table.restaurant, MenuChannel.TABLE, table);
  }

  async getMenuByDeliverySlug(slug: string): Promise<MenuDto> {
    const restaurant = await this.restaurantsRepo.findOne({
      where: { slug, active: true },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurante não encontrado');
    }

    return this.buildMenu(restaurant, MenuChannel.DELIVERY);
  }

  private async buildMenu(
    restaurant: Restaurant,
    channel: MenuChannel,
    table?: Table,
  ): Promise<MenuDto> {
    const categories = await this.categoriesRepo.find({
      where: { restaurantId: restaurant.id, active: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });

    const products = await this.productsRepo
      .createQueryBuilder('product')
      .innerJoin('product.category', 'category')
      .where('category.restaurantId = :restaurantId', { restaurantId: restaurant.id })
      .andWhere('product.available = :available', { available: true })
      .orderBy('product.sortOrder', 'ASC')
      .addOrderBy('product.name', 'ASC')
      .getMany();

    const channelProducts = products.filter((product) => isProductOnChannel(product, channel));

    const suggestions =
      channelProducts.length === 0
        ? []
        : await this.suggestionsRepo.find({
            where: { sourceProductId: In(channelProducts.map((product) => product.id)) },
            order: { sortOrder: 'ASC' },
          });

    const suggestedBySource = new Map<string, string[]>();
    for (const suggestion of suggestions) {
      const list = suggestedBySource.get(suggestion.sourceProductId) ?? [];
      list.push(suggestion.suggestedProductId);
      suggestedBySource.set(suggestion.sourceProductId, list);
    }

    const productsByCategory = new Map<string, ProductDto[]>();
    for (const product of channelProducts) {
      const category = categories.find((entry) => entry.id === product.categoryId);
      if (!category) continue;

      const manualSuggestions = (suggestedBySource.get(product.id) ?? []).filter((id) => {
        const suggested = channelProducts.find((entry) => entry.id === id);
        return suggested && isProductOnChannel(suggested, channel);
      });

      const list = productsByCategory.get(product.categoryId) ?? [];
      list.push(this.mapProduct(product, manualSuggestions));
      productsByCategory.set(product.categoryId, list);
    }

    const categoryDtos: CategoryDto[] = categories
      .map((category) => ({
        id: category.id,
        name: category.name,
        description: category.description,
        sortOrder: category.sortOrder,
        active: category.active,
        products: productsByCategory.get(category.id) ?? [],
      }))
      .filter((category) => category.products.length > 0);

    return {
      channel,
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        paymentMode: restaurant.paymentMode,
      },
      payment: {
        stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY ?? null,
      },
      table: table
        ? {
            id: table.id,
            number: table.number,
            label: table.label,
            token: table.token,
            active: table.active,
          }
        : null,
      categories: categoryDtos,
      upsell: {
        drinkCategoryId: restaurant.upsellDrinkCategoryId,
        foodOnlyEnabled: restaurant.upsellFoodOnlyEnabled,
        foodOnlyCategoryId: restaurant.upsellFoodOnlyCategoryId,
        drinksOnlyEnabled: restaurant.upsellDrinksOnlyEnabled,
        drinksOnlyCategoryId: restaurant.upsellDrinksOnlyCategoryId,
      },
    };
  }

  private mapProduct(product: Product, suggestedProductIds: string[]): ProductDto {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: Number(product.price),
      imageUrl: product.imageUrl,
      available: product.available,
      sortOrder: product.sortOrder,
      categoryId: product.categoryId,
      suggestedProductIds,
      channels: parseProductChannels(product.channels),
      optionGroups: product.optionGroups ?? [],
    };
  }
}
