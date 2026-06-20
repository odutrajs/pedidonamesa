import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Category, Product, ProductSuggestion, Restaurant, Table } from '../entities';
import { StorageService } from '../storage/storage.service';
import { MenuChannel, parseProductChannels } from '@pedidonamesa/shared';
import {
  CreateCategoryDto,
  CreateProductDto,
  CreateTableDto,
  UpdateCategoryDto,
  UpdateProductDto,
  UpdateProductSuggestionsDto,
  UpdateRestaurantSettingsDto,
  UpdateTableDto,
} from './dto/admin.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepo: Repository<Category>,
    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,
    @InjectRepository(Table)
    private readonly tablesRepo: Repository<Table>,
    @InjectRepository(Restaurant)
    private readonly restaurantsRepo: Repository<Restaurant>,
    @InjectRepository(ProductSuggestion)
    private readonly suggestionsRepo: Repository<ProductSuggestion>,
    private readonly storage: StorageService,
  ) {}

  getCategories(restaurantId: string) {
    return this.categoriesRepo.find({
      where: { restaurantId },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async createCategory(restaurantId: string, dto: CreateCategoryDto) {
    const last = await this.categoriesRepo.findOne({
      where: { restaurantId },
      order: { sortOrder: 'DESC' },
    });
    const nextSortOrder = (last?.sortOrder ?? 0) + 1;

    const category = this.categoriesRepo.create({
      ...dto,
      restaurantId,
      sortOrder: dto.sortOrder ?? nextSortOrder,
    });
    return this.categoriesRepo.save(category);
  }

  async updateCategory(id: string, restaurantId: string, dto: UpdateCategoryDto) {
    const category = await this.categoriesRepo.findOne({ where: { id, restaurantId } });
    if (!category) throw new NotFoundException('Categoria não encontrada');
    Object.assign(category, dto);
    return this.categoriesRepo.save(category);
  }

  async reorderCategories(restaurantId: string, orderedIds: string[]) {
    const categories = await this.categoriesRepo.find({
      where: { restaurantId },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });

    if (orderedIds.length !== categories.length) {
      throw new BadRequestException('Lista de categorias inválida');
    }

    const categoryIds = new Set(categories.map((category) => category.id));
    for (const id of orderedIds) {
      if (!categoryIds.has(id)) {
        throw new BadRequestException('Categoria não encontrada');
      }
    }

    const byId = new Map(categories.map((category) => [category.id, category]));

    for (let index = 0; index < orderedIds.length; index++) {
      const category = byId.get(orderedIds[index])!;
      category.sortOrder = index + 1;
    }

    await this.categoriesRepo.save(categories);
    return this.getCategories(restaurantId);
  }

  async deleteCategory(id: string, restaurantId: string) {
    const category = await this.categoriesRepo.findOne({ where: { id, restaurantId } });
    if (!category) throw new NotFoundException('Categoria não encontrada');
    await this.categoriesRepo.remove(category);
    return { ok: true };
  }

  async getProducts(restaurantId: string) {
    const products = await this.productsRepo
      .createQueryBuilder('product')
      .innerJoin('product.category', 'category')
      .where('category.restaurantId = :restaurantId', { restaurantId })
      .orderBy('product.sortOrder', 'ASC')
      .getMany();

    if (products.length === 0) return [];

    const suggestions = await this.suggestionsRepo.find({
      where: { sourceProductId: In(products.map((product) => product.id)) },
      order: { sortOrder: 'ASC' },
    });

    const suggestedBySource = new Map<string, string[]>();
    for (const suggestion of suggestions) {
      const list = suggestedBySource.get(suggestion.sourceProductId) ?? [];
      list.push(suggestion.suggestedProductId);
      suggestedBySource.set(suggestion.sourceProductId, list);
    }

    return products.map((product) => ({
      ...product,
      price: Number(product.price),
      suggestedProductIds: suggestedBySource.get(product.id) ?? [],
      channels: parseProductChannels(product.channels),
      optionGroups: product.optionGroups ?? [],
    }));
  }

  async createProduct(
    restaurantId: string,
    dto: CreateProductDto,
    file?: Express.Multer.File,
  ) {
    const category = await this.categoriesRepo.findOne({
      where: { id: dto.categoryId, restaurantId },
    });
    if (!category) throw new NotFoundException('Categoria não encontrada');

    const product = this.productsRepo.create({
      ...dto,
      sortOrder: dto.sortOrder ?? 0,
      channels: dto.channels?.length
        ? dto.channels
        : [MenuChannel.TABLE, MenuChannel.DELIVERY],
    });

    if (file) {
      product.imageUrl = await this.storage.uploadProductImage(
        file.originalname,
        file.buffer,
        file.mimetype,
      );
    }

    return this.productsRepo.save(product);
  }

  async updateProduct(id: string, restaurantId: string, dto: UpdateProductDto) {
    const product = await this.productsRepo
      .createQueryBuilder('product')
      .innerJoin('product.category', 'category')
      .where('product.id = :id', { id })
      .andWhere('category.restaurantId = :restaurantId', { restaurantId })
      .getOne();

    if (!product) throw new NotFoundException('Produto não encontrado');

    if (dto.categoryId) {
      const category = await this.categoriesRepo.findOne({
        where: { id: dto.categoryId, restaurantId },
      });
      if (!category) throw new NotFoundException('Categoria não encontrada');
    }

    Object.assign(product, dto);
    return this.productsRepo.save(product);
  }

  async uploadProductImage(
    id: string,
    restaurantId: string,
    file: Express.Multer.File,
  ) {
    const product = await this.productsRepo
      .createQueryBuilder('product')
      .innerJoin('product.category', 'category')
      .where('product.id = :id', { id })
      .andWhere('category.restaurantId = :restaurantId', { restaurantId })
      .getOne();

    if (!product) throw new NotFoundException('Produto não encontrado');

    const imageUrl = await this.storage.uploadProductImage(
      file.originalname,
      file.buffer,
      file.mimetype,
    );

    product.imageUrl = imageUrl;
    return this.productsRepo.save(product);
  }

  async deleteProduct(id: string, restaurantId: string) {
    const product = await this.productsRepo
      .createQueryBuilder('product')
      .innerJoin('product.category', 'category')
      .where('product.id = :id', { id })
      .andWhere('category.restaurantId = :restaurantId', { restaurantId })
      .getOne();

    if (!product) throw new NotFoundException('Produto não encontrado');
    await this.productsRepo.remove(product);
    return { ok: true };
  }

  async updateProductSuggestions(
    productId: string,
    restaurantId: string,
    dto: UpdateProductSuggestionsDto,
  ) {
    const product = await this.productsRepo
      .createQueryBuilder('product')
      .innerJoin('product.category', 'category')
      .where('product.id = :id', { id: productId })
      .andWhere('category.restaurantId = :restaurantId', { restaurantId })
      .getOne();

    if (!product) throw new NotFoundException('Produto não encontrado');

    const uniqueIds = [...new Set(dto.suggestedProductIds)].filter((id) => id !== productId);

    if (uniqueIds.length > 0) {
      const suggestedProducts = await this.productsRepo
        .createQueryBuilder('product')
        .innerJoin('product.category', 'category')
        .where('product.id IN (:...ids)', { ids: uniqueIds })
        .andWhere('category.restaurantId = :restaurantId', { restaurantId })
        .getMany();

      if (suggestedProducts.length !== uniqueIds.length) {
        throw new BadRequestException('Um ou mais produtos sugeridos são inválidos');
      }
    }

    await this.suggestionsRepo.delete({ sourceProductId: productId });

    if (uniqueIds.length > 0) {
      await this.suggestionsRepo.save(
        uniqueIds.map((suggestedProductId, index) =>
          this.suggestionsRepo.create({
            sourceProductId: productId,
            suggestedProductId,
            sortOrder: index,
          }),
        ),
      );
    }

    return { suggestedProductIds: uniqueIds };
  }

  getTables(restaurantId: string) {
    return this.tablesRepo.find({
      where: { restaurantId },
      order: { number: 'ASC' },
    });
  }

  createTable(restaurantId: string, dto: CreateTableDto) {
    const table = this.tablesRepo.create({
      ...dto,
      restaurantId,
      token: uuidv4(),
    });
    return this.tablesRepo.save(table);
  }

  async updateTable(id: string, restaurantId: string, dto: UpdateTableDto) {
    const table = await this.tablesRepo.findOne({ where: { id, restaurantId } });
    if (!table) throw new NotFoundException('Mesa não encontrada');
    Object.assign(table, dto);
    return this.tablesRepo.save(table);
  }

  async regenerateTableToken(id: string, restaurantId: string) {
    const table = await this.tablesRepo.findOne({ where: { id, restaurantId } });
    if (!table) throw new NotFoundException('Mesa não encontrada');
    table.token = uuidv4();
    return this.tablesRepo.save(table);
  }

  async getRestaurantSettings(restaurantId: string) {
    const restaurant = await this.restaurantsRepo.findOne({ where: { id: restaurantId } });
    if (!restaurant) throw new NotFoundException('Restaurante não encontrado');

    return {
      id: restaurant.id,
      name: restaurant.name,
      slug: restaurant.slug,
      paymentMode: restaurant.paymentMode,
      inventoryEnabled: restaurant.inventoryEnabled,
      financeEnabled: restaurant.financeEnabled,
      whatsappEnabled: restaurant.whatsappEnabled,
      deliveryEnabled: restaurant.deliveryEnabled,
      upsellDrinkCategoryId: restaurant.upsellDrinkCategoryId,
      upsellFoodOnlyEnabled: restaurant.upsellFoodOnlyEnabled,
      upsellFoodOnlyCategoryId: restaurant.upsellFoodOnlyCategoryId,
      upsellDrinksOnlyEnabled: restaurant.upsellDrinksOnlyEnabled,
      upsellDrinksOnlyCategoryId: restaurant.upsellDrinksOnlyCategoryId,
      whatsappBotEnabled: restaurant.whatsappBotEnabled,
      whatsappBotPaused: restaurant.whatsappBotPaused,
      whatsappWelcomeMessage: restaurant.whatsappWelcomeMessage,
      whatsappBusinessHours: restaurant.whatsappBusinessHours,
      whatsappAddress: restaurant.whatsappAddress,
    };
  }

  private async assertCategory(restaurantId: string, categoryId: string, label: string) {
    const category = await this.categoriesRepo.findOne({
      where: { id: categoryId, restaurantId },
    });
    if (!category) throw new BadRequestException(`${label} inválida`);
  }

  async updateRestaurantSettings(restaurantId: string, dto: UpdateRestaurantSettingsDto) {
    const restaurant = await this.restaurantsRepo.findOne({ where: { id: restaurantId } });
    if (!restaurant) throw new NotFoundException('Restaurante não encontrado');

    if (dto.paymentMode !== undefined) {
      restaurant.paymentMode = dto.paymentMode;
    }

    if (dto.upsellFoodOnlyEnabled !== undefined) {
      restaurant.upsellFoodOnlyEnabled = dto.upsellFoodOnlyEnabled;
    }

    if (dto.upsellDrinksOnlyEnabled !== undefined) {
      restaurant.upsellDrinksOnlyEnabled = dto.upsellDrinksOnlyEnabled;
    }

    if (dto.upsellDrinkCategoryId !== undefined) {
      if (dto.upsellDrinkCategoryId) {
        await this.assertCategory(restaurantId, dto.upsellDrinkCategoryId, 'Categoria de bebidas');
      }
      restaurant.upsellDrinkCategoryId = dto.upsellDrinkCategoryId;
    }

    if (dto.upsellFoodOnlyCategoryId !== undefined) {
      if (dto.upsellFoodOnlyCategoryId) {
        await this.assertCategory(restaurantId, dto.upsellFoodOnlyCategoryId, 'Categoria de upsell');
      }
      restaurant.upsellFoodOnlyCategoryId = dto.upsellFoodOnlyCategoryId;
    }

    if (dto.upsellDrinksOnlyCategoryId !== undefined) {
      if (dto.upsellDrinksOnlyCategoryId) {
        await this.assertCategory(restaurantId, dto.upsellDrinksOnlyCategoryId, 'Categoria de upsell');
      }
      restaurant.upsellDrinksOnlyCategoryId = dto.upsellDrinksOnlyCategoryId;
    }

    if (dto.whatsappBotEnabled !== undefined) {
      restaurant.whatsappBotEnabled = dto.whatsappBotEnabled;
    }

    if (dto.whatsappBotPaused !== undefined) {
      restaurant.whatsappBotPaused = dto.whatsappBotPaused;
    }

    if (dto.whatsappWelcomeMessage !== undefined) {
      restaurant.whatsappWelcomeMessage = dto.whatsappWelcomeMessage;
    }

    if (dto.whatsappBusinessHours !== undefined) {
      restaurant.whatsappBusinessHours = dto.whatsappBusinessHours;
    }

    if (dto.whatsappAddress !== undefined) {
      restaurant.whatsappAddress = dto.whatsappAddress;
    }

    await this.restaurantsRepo.save(restaurant);

    return {
      id: restaurant.id,
      name: restaurant.name,
      slug: restaurant.slug,
      paymentMode: restaurant.paymentMode,
      inventoryEnabled: restaurant.inventoryEnabled,
      financeEnabled: restaurant.financeEnabled,
      whatsappEnabled: restaurant.whatsappEnabled,
      deliveryEnabled: restaurant.deliveryEnabled,
      upsellDrinkCategoryId: restaurant.upsellDrinkCategoryId,
      upsellFoodOnlyEnabled: restaurant.upsellFoodOnlyEnabled,
      upsellFoodOnlyCategoryId: restaurant.upsellFoodOnlyCategoryId,
      upsellDrinksOnlyEnabled: restaurant.upsellDrinksOnlyEnabled,
      upsellDrinksOnlyCategoryId: restaurant.upsellDrinksOnlyCategoryId,
      whatsappBotEnabled: restaurant.whatsappBotEnabled,
      whatsappBotPaused: restaurant.whatsappBotPaused,
      whatsappWelcomeMessage: restaurant.whatsappWelcomeMessage,
      whatsappBusinessHours: restaurant.whatsappBusinessHours,
      whatsappAddress: restaurant.whatsappAddress,
    };
  }
}
