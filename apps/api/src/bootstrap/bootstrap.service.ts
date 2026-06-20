import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { UserRole } from '@pedidonamesa/shared';
import { Restaurant, User, Table, Category, Product } from '../entities';

@Injectable()
export class BootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(BootstrapService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    await this.ensureSuperAdmin();
    await this.ensureDemoRestaurant();
  }

  private async ensureSuperAdmin() {
    const usersRepo = this.dataSource.getRepository(User);
    const email = this.config.get('SUPER_ADMIN_EMAIL', 'super@pedidonamesa.com');
    const existing = await usersRepo.findOne({ where: { email } });
    if (existing) return;

    const password = this.config.get('SUPER_ADMIN_PASSWORD', 'superadmin123');
    const passwordHash = await bcrypt.hash(password, 10);

    await usersRepo.save(
      usersRepo.create({
        name: 'Super Admin',
        email,
        passwordHash,
        role: UserRole.SUPER_ADMIN,
        restaurantId: null,
      }),
    );

    this.logger.log(`Super admin criado: ${email}`);
  }

  private async ensureDemoRestaurant() {
    const restaurantsRepo = this.dataSource.getRepository(Restaurant);
    const existing = await restaurantsRepo.findOne({ where: { slug: 'demo' } });
    if (existing) return;

    this.logger.log('Banco vazio — criando dados iniciais...');

    const restaurant = await restaurantsRepo.save(
      restaurantsRepo.create({
        name: 'Restaurante Demo',
        slug: 'demo',
        description: 'Cardápio de demonstração do Pedido na Mesa',
      }),
    );

    const passwordHash = await bcrypt.hash('admin123', 10);
    const usersRepo = this.dataSource.getRepository(User);
    await usersRepo.save([
      usersRepo.create({
        name: 'Administrador',
        email: 'admin@demo.com',
        passwordHash,
        role: UserRole.ADMIN,
        restaurantId: restaurant.id,
      }),
      usersRepo.create({
        name: 'Cozinha',
        email: 'cozinha@demo.com',
        passwordHash,
        role: UserRole.KITCHEN,
        restaurantId: restaurant.id,
      }),
    ]);

    const tableToken = uuidv4();
    const tablesRepo = this.dataSource.getRepository(Table);
    await tablesRepo.save([
      tablesRepo.create({
        number: 1,
        label: 'Varanda',
        token: tableToken,
        restaurantId: restaurant.id,
      }),
      tablesRepo.create({ number: 2, token: uuidv4(), restaurantId: restaurant.id }),
      tablesRepo.create({ number: 3, label: 'Salão', token: uuidv4(), restaurantId: restaurant.id }),
    ]);

    const categoriesRepo = this.dataSource.getRepository(Category);
    const bebidas = await categoriesRepo.save(
      categoriesRepo.create({
        name: 'Bebidas',
        description: 'Refrigerantes, sucos e água',
        sortOrder: 1,
        restaurantId: restaurant.id,
      }),
    );
    const pratos = await categoriesRepo.save(
      categoriesRepo.create({
        name: 'Pratos',
        description: 'Pratos principais',
        sortOrder: 2,
        restaurantId: restaurant.id,
      }),
    );
    const sobremesas = await categoriesRepo.save(
      categoriesRepo.create({ name: 'Sobremesas', sortOrder: 3, restaurantId: restaurant.id }),
    );

    const productsRepo = this.dataSource.getRepository(Product);
    await productsRepo.save([
      productsRepo.create({ name: 'Água mineral', description: '500ml', price: 5, categoryId: bebidas.id, sortOrder: 1 }),
      productsRepo.create({ name: 'Suco de laranja', description: 'Natural 400ml', price: 12, categoryId: bebidas.id, sortOrder: 2 }),
      productsRepo.create({ name: 'Coca-Cola', description: 'Lata 350ml', price: 8, categoryId: bebidas.id, sortOrder: 3 }),
      productsRepo.create({ name: 'X-Burger', description: 'Pão, hambúrguer, queijo', price: 28, categoryId: pratos.id, sortOrder: 1 }),
      productsRepo.create({ name: 'Filé com fritas', description: 'Arroz, filé e batata', price: 45, categoryId: pratos.id, sortOrder: 2 }),
      productsRepo.create({ name: 'Pudim', description: 'Pudim de leite', price: 15, categoryId: sobremesas.id, sortOrder: 1 }),
    ]);

    this.logger.log(`Seed OK. Mesa 1 token: ${tableToken}`);
  }
}
