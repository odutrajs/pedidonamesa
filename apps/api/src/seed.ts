import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Restaurant, User, Table, Category, Product, ProductSuggestion } from './entities';
import { UserRole } from '@pedidonamesa/shared';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  const restaurantsRepo = dataSource.getRepository(Restaurant);
  const usersRepo = dataSource.getRepository(User);
  const tablesRepo = dataSource.getRepository(Table);
  const categoriesRepo = dataSource.getRepository(Category);
  const productsRepo = dataSource.getRepository(Product);
  const suggestionsRepo = dataSource.getRepository(ProductSuggestion);

  let restaurant = await restaurantsRepo.findOne({ where: { slug: 'demo' } });

  if (!restaurant) {
    restaurant = await restaurantsRepo.save(
      restaurantsRepo.create({
        name: 'Restaurante Demo',
        slug: 'demo',
        description: 'Cardápio de demonstração do Pedido na Mesa',
      }),
    );

    const passwordHash = await bcrypt.hash('admin123', 10);

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
    await tablesRepo.save([
      tablesRepo.create({ number: 1, label: 'Varanda', token: tableToken, restaurantId: restaurant.id }),
      tablesRepo.create({ number: 2, label: null, token: uuidv4(), restaurantId: restaurant.id }),
      tablesRepo.create({ number: 3, label: 'Salão', token: uuidv4(), restaurantId: restaurant.id }),
    ]);

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
      categoriesRepo.create({
        name: 'Sobremesas',
        sortOrder: 3,
        restaurantId: restaurant.id,
      }),
    );

    await productsRepo.save([
      productsRepo.create({
        name: 'Água mineral',
        description: '500ml',
        price: 5,
        categoryId: bebidas.id,
        sortOrder: 1,
      }),
      productsRepo.create({
        name: 'Suco de laranja',
        description: 'Natural 400ml',
        price: 12,
        categoryId: bebidas.id,
        sortOrder: 2,
      }),
      productsRepo.create({
        name: 'Coca-Cola',
        description: 'Lata 350ml',
        price: 8,
        categoryId: bebidas.id,
        sortOrder: 3,
      }),
      productsRepo.create({
        name: 'X-Burger',
        description: 'Pão, hambúrguer, queijo, salada',
        price: 28,
        categoryId: pratos.id,
        sortOrder: 1,
      }),
      productsRepo.create({
        name: 'Filé com fritas',
        description: 'Arroz, filé e batata frita',
        price: 45,
        categoryId: pratos.id,
        sortOrder: 2,
      }),
      productsRepo.create({
        name: 'Pudim',
        description: 'Pudim de leite',
        price: 15,
        categoryId: sobremesas.id,
        sortOrder: 1,
      }),
    ]);

    const savedProducts = await productsRepo
      .createQueryBuilder('product')
      .innerJoin('product.category', 'category')
      .where('category.restaurantId = :restaurantId', { restaurantId: restaurant.id })
      .getMany();

    const xBurger = savedProducts.find((product) => product.name === 'X-Burger');
    const cocaCola = savedProducts.find((product) => product.name === 'Coca-Cola');

    if (xBurger && cocaCola) {
      await suggestionsRepo.save(
        suggestionsRepo.create({
          sourceProductId: xBurger.id,
          suggestedProductId: cocaCola.id,
          sortOrder: 0,
        }),
      );
    }

    restaurant.upsellFoodOnlyEnabled = true;
    restaurant.upsellDrinkCategoryId = bebidas.id;
    restaurant.upsellFoodOnlyCategoryId = bebidas.id;
    restaurant.upsellDrinksOnlyEnabled = true;
    restaurant.upsellDrinksOnlyCategoryId = pratos.id;
    await restaurantsRepo.save(restaurant);

    console.log('\n✅ Seed completo!\n');
    console.log('Admin: admin@demo.com / admin123');
    console.log('Cozinha: cozinha@demo.com / admin123');
    console.log(`Mesa 1 token (QR): ${tableToken}`);
    console.log(`URL mesa: http://localhost:5173/mesa/${tableToken}`);
    console.log(`URL delivery: http://localhost:5173/entrega/demo\n`);
  } else {
    const table = await tablesRepo.findOne({ where: { restaurantId: restaurant.id, number: 1 } });
    console.log('Seed já existente. Mesa 1 token:', table?.token);
  }

  await app.close();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
