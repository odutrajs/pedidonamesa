import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Category, Product, Restaurant, Table } from '../entities';
import { StorageService } from '../storage/storage.service';
import {
  CreateCategoryDto,
  CreateProductDto,
  CreateTableDto,
  UpdateCategoryDto,
  UpdateProductDto,
  UpdateTableDto,
} from './dto/admin.dto';
import { UpdatePaymentSettingsDto } from '../payments/dto/payment.dto';

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

  getProducts(restaurantId: string) {
    return this.productsRepo
      .createQueryBuilder('product')
      .innerJoin('product.category', 'category')
      .where('category.restaurantId = :restaurantId', { restaurantId })
      .orderBy('product.sortOrder', 'ASC')
      .getMany();
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
      paymentMode: restaurant.paymentMode,
    };
  }

  async updateRestaurantSettings(restaurantId: string, dto: UpdatePaymentSettingsDto) {
    const restaurant = await this.restaurantsRepo.findOne({ where: { id: restaurantId } });
    if (!restaurant) throw new NotFoundException('Restaurante não encontrado');

    restaurant.paymentMode = dto.paymentMode;
    await this.restaurantsRepo.save(restaurant);

    return {
      id: restaurant.id,
      name: restaurant.name,
      paymentMode: restaurant.paymentMode,
    };
  }
}
