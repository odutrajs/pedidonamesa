import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryDto, MenuDto, ProductDto } from '@pedidonamesa/shared';
import { Table } from '../entities/table.entity';
import { Category } from '../entities/category.entity';
import { Product } from '../entities/product.entity';

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(Table)
    private readonly tablesRepo: Repository<Table>,
    @InjectRepository(Category)
    private readonly categoriesRepo: Repository<Category>,
    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,
  ) {}

  async getMenuByTableToken(token: string): Promise<MenuDto> {
    const table = await this.tablesRepo.findOne({
      where: { token, active: true },
      relations: ['restaurant'],
    });

    if (!table) {
      throw new NotFoundException('Mesa não encontrada');
    }

    const categories = await this.categoriesRepo.find({
      where: { restaurantId: table.restaurantId, active: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });

    const products = await this.productsRepo
      .createQueryBuilder('product')
      .innerJoin('product.category', 'category')
      .where('category.restaurantId = :restaurantId', { restaurantId: table.restaurantId })
      .andWhere('product.available = :available', { available: true })
      .orderBy('product.sortOrder', 'ASC')
      .addOrderBy('product.name', 'ASC')
      .getMany();

    const productsByCategory = new Map<string, ProductDto[]>();
    for (const product of products) {
      const category = categories.find((c) => c.id === product.categoryId);
      if (!category) continue;

      const list = productsByCategory.get(product.categoryId) ?? [];
      list.push(this.mapProduct(product));
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
      .filter((c) => c.products.length > 0);

    return {
      restaurant: {
        id: table.restaurant.id,
        name: table.restaurant.name,
        slug: table.restaurant.slug,
        paymentMode: table.restaurant.paymentMode,
      },
      payment: {
        stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY ?? null,
      },
      table: {
        id: table.id,
        number: table.number,
        label: table.label,
        token: table.token,
        active: table.active,
      },
      categories: categoryDtos,
    };
  }

  async getCategoriesForRestaurant(restaurantId: string) {
    const categories = await this.categoriesRepo.find({
      where: { restaurantId },
      order: { sortOrder: 'ASC' },
    });

    const products = await this.productsRepo.find({
      order: { sortOrder: 'ASC' },
    });

    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      description: category.description,
      sortOrder: category.sortOrder,
      active: category.active,
      products: products
        .filter((p) => p.categoryId === category.id)
        .map((p) => this.mapProduct(p)),
    }));
  }

  private mapProduct(product: Product): ProductDto {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: Number(product.price),
      imageUrl: product.imageUrl,
      available: product.available,
      sortOrder: product.sortOrder,
      categoryId: product.categoryId,
    };
  }
}
