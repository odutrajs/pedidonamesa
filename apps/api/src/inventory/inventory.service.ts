import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, LessThanOrEqual, Repository } from 'typeorm';
import {
  CmvReportDto,
  IngredientDto,
  InventoryCountDto,
  OrderItemStatus,
  OrderStatus,
  ProductRecipeDto,
  StockMovementDto,
  StockMovementType,
} from '@pedidonamesa/shared';
import {
  Ingredient,
  InventoryCount,
  InventoryCountLine,
  Order,
  OrderItem,
  Product,
  ProductIngredient,
  StockMovement,
} from '../entities';
import {
  CreateIngredientDto,
  StockMovementDto as StockMovementInputDto,
  SubmitInventoryCountDto,
  UpdateIngredientDto,
  UpdateProductRecipeDto,
} from './dto/inventory.dto';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Ingredient)
    private readonly ingredientsRepo: Repository<Ingredient>,
    @InjectRepository(ProductIngredient)
    private readonly recipeRepo: Repository<ProductIngredient>,
    @InjectRepository(StockMovement)
    private readonly movementsRepo: Repository<StockMovement>,
    @InjectRepository(InventoryCount)
    private readonly countsRepo: Repository<InventoryCount>,
    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,
    @InjectRepository(Order)
    private readonly ordersRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemsRepo: Repository<OrderItem>,
  ) {}

  async listIngredients(restaurantId: string): Promise<IngredientDto[]> {
    const ingredients = await this.ingredientsRepo.find({
      where: { restaurantId },
      order: { name: 'ASC' },
    });
    return ingredients.map((entry) => this.mapIngredient(entry));
  }

  async createIngredient(restaurantId: string, dto: CreateIngredientDto): Promise<IngredientDto> {
    const ingredient = this.ingredientsRepo.create({
      restaurantId,
      name: dto.name.trim(),
      unit: dto.unit,
      costPerUnit: dto.costPerUnit ?? 0,
      currentStock: dto.currentStock ?? 0,
      minStock: dto.minStock ?? 0,
      active: true,
    });
    const saved = await this.ingredientsRepo.save(ingredient);
    return this.mapIngredient(saved);
  }

  async updateIngredient(
    id: string,
    restaurantId: string,
    dto: UpdateIngredientDto,
  ): Promise<IngredientDto> {
    const ingredient = await this.findIngredient(id, restaurantId);
    if (dto.name !== undefined) ingredient.name = dto.name.trim();
    if (dto.unit !== undefined) ingredient.unit = dto.unit;
    if (dto.costPerUnit !== undefined) ingredient.costPerUnit = dto.costPerUnit;
    if (dto.minStock !== undefined) ingredient.minStock = dto.minStock;
    if (dto.active !== undefined) ingredient.active = dto.active;
    const saved = await this.ingredientsRepo.save(ingredient);
    return this.mapIngredient(saved);
  }

  async deleteIngredient(id: string, restaurantId: string) {
    const ingredient = await this.findIngredient(id, restaurantId);
    await this.ingredientsRepo.remove(ingredient);
    return { ok: true };
  }

  async recordPurchase(restaurantId: string, dto: StockMovementInputDto): Promise<StockMovementDto> {
    if (dto.quantity <= 0) {
      throw new BadRequestException('Quantidade deve ser maior que zero');
    }

    const ingredient = await this.findIngredient(dto.ingredientId, restaurantId);
    const unitCost = dto.unitCost ?? Number(ingredient.costPerUnit);

    if (dto.unitCost !== undefined) {
      ingredient.costPerUnit = dto.unitCost;
    }

    ingredient.currentStock = Number(ingredient.currentStock) + dto.quantity;
    await this.ingredientsRepo.save(ingredient);

    const movement = await this.movementsRepo.save(
      this.movementsRepo.create({
        restaurantId,
        ingredientId: ingredient.id,
        type: StockMovementType.PURCHASE,
        quantity: dto.quantity,
        unitCost,
        balanceAfter: ingredient.currentStock,
        notes: dto.notes ?? null,
      }),
    );

    return this.mapMovement(movement, ingredient.name);
  }

  async recordAdjustment(restaurantId: string, dto: StockMovementInputDto): Promise<StockMovementDto> {
    if (dto.quantity === 0) {
      throw new BadRequestException('Quantidade não pode ser zero');
    }

    const ingredient = await this.findIngredient(dto.ingredientId, restaurantId);
    const nextStock = Number(ingredient.currentStock) + dto.quantity;

    if (nextStock < 0) {
      throw new BadRequestException('Ajuste deixaria estoque negativo');
    }

    ingredient.currentStock = nextStock;
    await this.ingredientsRepo.save(ingredient);

    const movement = await this.movementsRepo.save(
      this.movementsRepo.create({
        restaurantId,
        ingredientId: ingredient.id,
        type: StockMovementType.ADJUSTMENT,
        quantity: dto.quantity,
        unitCost: Number(ingredient.costPerUnit),
        balanceAfter: ingredient.currentStock,
        notes: dto.notes ?? null,
      }),
    );

    return this.mapMovement(movement, ingredient.name);
  }

  async listMovements(restaurantId: string, limit = 50): Promise<StockMovementDto[]> {
    const movements = await this.movementsRepo.find({
      where: { restaurantId },
      relations: ['ingredient'],
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return movements.map((movement) => this.mapMovement(movement, movement.ingredient.name));
  }

  async getLowStockAlerts(restaurantId: string): Promise<IngredientDto[]> {
    const ingredients = await this.ingredientsRepo.find({
      where: { restaurantId, active: true },
      order: { name: 'ASC' },
    });

    return ingredients
      .filter((entry) => Number(entry.currentStock) <= Number(entry.minStock))
      .map((entry) => this.mapIngredient(entry));
  }

  async getProductRecipe(productId: string, restaurantId: string): Promise<ProductRecipeDto> {
    const product = await this.productsRepo
      .createQueryBuilder('product')
      .innerJoin('product.category', 'category')
      .where('product.id = :productId', { productId })
      .andWhere('category.restaurantId = :restaurantId', { restaurantId })
      .getOne();

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    const lines = await this.recipeRepo.find({
      where: { productId },
      relations: ['ingredient'],
      order: { createdAt: 'ASC' },
    });

    const ingredients = lines.map((line) => {
      const lineCost = Number(line.quantity) * Number(line.ingredient.costPerUnit);
      return {
        id: line.id,
        productId: line.productId,
        ingredientId: line.ingredientId,
        ingredientName: line.ingredient.name,
        ingredientUnit: line.ingredient.unit,
        quantity: Number(line.quantity),
        lineCost,
      };
    });

    const totalCost = ingredients.reduce((sum, line) => sum + line.lineCost, 0);
    const productPrice = Number(product.price);
    const margin = productPrice - totalCost;
    const marginPercent = productPrice > 0 ? (margin / productPrice) * 100 : 0;

    return {
      productId: product.id,
      productName: product.name,
      productPrice,
      ingredients,
      totalCost,
      margin,
      marginPercent,
    };
  }

  async updateProductRecipe(
    productId: string,
    restaurantId: string,
    dto: UpdateProductRecipeDto,
  ): Promise<ProductRecipeDto> {
    await this.getProductRecipe(productId, restaurantId);

    const ingredientIds = dto.lines.map((line) => line.ingredientId);
    if (new Set(ingredientIds).size !== ingredientIds.length) {
      throw new BadRequestException('Ingrediente duplicado na ficha técnica');
    }

    const ingredients = await this.ingredientsRepo.find({
      where: { id: In(ingredientIds), restaurantId },
    });

    if (ingredients.length !== ingredientIds.length) {
      throw new BadRequestException('Ingrediente inválido');
    }

    await this.recipeRepo.delete({ productId });
    await this.recipeRepo.save(
      dto.lines.map((line) =>
        this.recipeRepo.create({
          productId,
          ingredientId: line.ingredientId,
          quantity: line.quantity,
        }),
      ),
    );

    return this.getProductRecipe(productId, restaurantId);
  }

  async submitInventoryCount(
    restaurantId: string,
    dto: SubmitInventoryCountDto,
  ): Promise<InventoryCountDto> {
    const ingredients = await this.ingredientsRepo.find({ where: { restaurantId, active: true } });
    const inputMap = new Map(dto.lines.map((line) => [line.ingredientId, line.physicalQuantity]));

    const lines: InventoryCountLine[] = [];
    let totalVarianceCost = 0;

    for (const ingredient of ingredients) {
      const physicalQuantity = inputMap.get(ingredient.id);
      if (physicalQuantity === undefined) continue;

      const systemQuantity = Number(ingredient.currentStock);
      const variance = physicalQuantity - systemQuantity;
      const unitCost = Number(ingredient.costPerUnit);
      const varianceCost = variance * unitCost;
      totalVarianceCost += varianceCost;

      lines.push(
        this.countsRepo.manager.create(InventoryCountLine, {
          ingredientId: ingredient.id,
          ingredientName: ingredient.name,
          unit: ingredient.unit,
          systemQuantity,
          physicalQuantity,
          variance,
          unitCost,
          varianceCost,
        }),
      );

      if (variance !== 0) {
        ingredient.currentStock = physicalQuantity;
        await this.ingredientsRepo.save(ingredient);
        await this.movementsRepo.save(
          this.movementsRepo.create({
            restaurantId,
            ingredientId: ingredient.id,
            type: StockMovementType.INVENTORY,
            quantity: variance,
            unitCost,
            balanceAfter: physicalQuantity,
            notes: dto.notes ?? 'Contagem física',
          }),
        );
      }
    }

    if (lines.length === 0) {
      throw new BadRequestException('Informe ao menos um ingrediente na contagem');
    }

    const count = await this.countsRepo.save(
      this.countsRepo.create({
        restaurantId,
        notes: dto.notes ?? null,
        totalVarianceCost,
        lines,
      }),
    );

    const full = await this.countsRepo.findOne({
      where: { id: count.id },
      relations: ['lines'],
    });

    return this.mapInventoryCount(full!);
  }

  async listInventoryCounts(restaurantId: string, limit = 20): Promise<InventoryCountDto[]> {
    const counts = await this.countsRepo.find({
      where: { restaurantId },
      relations: ['lines'],
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return counts.map((count) => this.mapInventoryCount(count));
  }

  async getCmvReport(restaurantId: string, from?: string, to?: string): Promise<CmvReportDto> {
    const periodTo = to ? new Date(to) : new Date();
    const periodFrom = from
      ? new Date(from)
      : new Date(periodTo.getFullYear(), periodTo.getMonth(), 1);

    const orders = await this.ordersRepo.find({
      where: {
        restaurantId,
        createdAt: Between(periodFrom, periodTo),
        status: In([
          OrderStatus.PENDING,
          OrderStatus.CONFIRMED,
          OrderStatus.PREPARING,
          OrderStatus.READY,
          OrderStatus.DELIVERED,
        ]),
      },
      relations: ['items'],
    });

    const revenue = orders.reduce((sum, order) => sum + Number(order.total), 0);
    const theoreticalCmv = await this.calculateTheoreticalCmvForOrders(orders);
    const theoreticalMargin = revenue - theoreticalCmv;
    const theoreticalMarginPercent = revenue > 0 ? (theoreticalMargin / revenue) * 100 : 0;

    const countsInPeriod = await this.countsRepo.find({
      where: {
        restaurantId,
        createdAt: Between(periodFrom, periodTo),
      },
      order: { createdAt: 'ASC' },
    });

    let realCmv: number | null = null;
    let variance: number | null = null;
    let variancePercent: number | null = null;

    if (countsInPeriod.length > 0) {
      const openingCount = await this.countsRepo.findOne({
        where: {
          restaurantId,
          createdAt: LessThanOrEqual(periodFrom),
        },
        relations: ['lines'],
        order: { createdAt: 'DESC' },
      });

      const purchases = await this.movementsRepo.find({
        where: {
          restaurantId,
          type: StockMovementType.PURCHASE,
          createdAt: Between(periodFrom, periodTo),
        },
      });

      const purchaseValue = purchases.reduce(
        (sum, movement) => sum + Math.abs(Number(movement.quantity)) * Number(movement.unitCost),
        0,
      );

      const openingValue = openingCount
        ? openingCount.lines.reduce(
            (sum, line) => sum + Number(line.physicalQuantity) * Number(line.unitCost),
            0,
          )
        : 0;

      const closingCount = countsInPeriod[countsInPeriod.length - 1];
      const closingFull = await this.countsRepo.findOne({
        where: { id: closingCount.id },
        relations: ['lines'],
      });

      const closingValue =
        closingFull?.lines.reduce(
          (sum, line) => sum + Number(line.physicalQuantity) * Number(line.unitCost),
          0,
        ) ?? 0;

      realCmv = openingValue + purchaseValue - closingValue;
      variance = realCmv - theoreticalCmv;
      variancePercent = theoreticalCmv > 0 ? (variance / theoreticalCmv) * 100 : null;
    }

    const topProducts = await this.buildTopProductsReport(restaurantId, orders);
    const lowStockAlerts = await this.getLowStockAlerts(restaurantId);

    return {
      period: { from: periodFrom.toISOString(), to: periodTo.toISOString() },
      revenue,
      ordersCount: orders.length,
      theoreticalCmv,
      theoreticalMargin,
      theoreticalMarginPercent,
      realCmv,
      variance,
      variancePercent,
      hasInventoryCount: countsInPeriod.length > 0,
      lowStockAlerts,
      topProducts,
    };
  }

  async consumeForOrder(orderId: string): Promise<void> {
    const order = await this.ordersRepo.findOne({
      where: { id: orderId },
      relations: ['items'],
    });

    if (!order || order.stockDeducted) return;

    const requirements = await this.buildOrderRequirements(order.restaurantId, order.items);
    if (requirements.size === 0) {
      order.stockDeducted = true;
      await this.ordersRepo.save(order);
      return;
    }

    for (const [ingredientId, quantity] of requirements.entries()) {
      const ingredient = await this.findIngredient(ingredientId, order.restaurantId);

      if (Number(ingredient.currentStock) < quantity) {
        throw new BadRequestException(
          `Estoque insuficiente de ${ingredient.name}. Disponível: ${Number(ingredient.currentStock)} ${ingredient.unit}`,
        );
      }
    }

    for (const [ingredientId, quantity] of requirements.entries()) {
      const ingredient = await this.findIngredient(ingredientId, order.restaurantId);
      ingredient.currentStock = Number(ingredient.currentStock) - quantity;
      await this.ingredientsRepo.save(ingredient);

      await this.movementsRepo.save(
        this.movementsRepo.create({
          restaurantId: order.restaurantId,
          ingredientId,
          type: StockMovementType.CONSUMPTION,
          quantity: -quantity,
          unitCost: Number(ingredient.costPerUnit),
          balanceAfter: ingredient.currentStock,
          orderId: order.id,
          notes: `Pedido #${order.id.slice(0, 8)}`,
        }),
      );
    }

    order.stockDeducted = true;
    await this.ordersRepo.save(order);
  }

  async restoreForOrder(orderId: string): Promise<void> {
    const order = await this.ordersRepo.findOne({ where: { id: orderId } });
    if (!order || !order.stockDeducted) return;

    const movements = await this.movementsRepo.find({
      where: {
        orderId: order.id,
        type: StockMovementType.CONSUMPTION,
      },
    });

    for (const movement of movements) {
      const ingredient = await this.findIngredient(movement.ingredientId, order.restaurantId);
      const restoreQty = Math.abs(Number(movement.quantity));
      ingredient.currentStock = Number(ingredient.currentStock) + restoreQty;
      await this.ingredientsRepo.save(ingredient);

      await this.movementsRepo.save(
        this.movementsRepo.create({
          restaurantId: order.restaurantId,
          ingredientId: ingredient.id,
          type: StockMovementType.RESTORE,
          quantity: restoreQty,
          unitCost: Number(ingredient.costPerUnit),
          balanceAfter: ingredient.currentStock,
          orderId: order.id,
          notes: `Cancelamento pedido #${order.id.slice(0, 8)}`,
        }),
      );
    }

    order.stockDeducted = false;
    await this.ordersRepo.save(order);
  }

  private async buildOrderRequirements(restaurantId: string, items: OrderItem[]) {
    const requirements = new Map<string, number>();

    for (const item of items) {
      if (item.status === OrderItemStatus.CANCELLED) continue;

      const recipe = await this.recipeRepo.find({
        where: { productId: item.productId },
      });

      for (const line of recipe) {
        const totalQty = Number(line.quantity) * item.quantity;
        requirements.set(line.ingredientId, (requirements.get(line.ingredientId) ?? 0) + totalQty);
      }
    }

    if (requirements.size === 0) return requirements;

    const validIngredients = await this.ingredientsRepo.find({
      where: { id: In([...requirements.keys()]), restaurantId, active: true },
    });

    const validIds = new Set(validIngredients.map((entry) => entry.id));
    for (const key of [...requirements.keys()]) {
      if (!validIds.has(key)) requirements.delete(key);
    }

    return requirements;
  }

  private async calculateTheoreticalCmvForOrders(orders: Order[]) {
    let total = 0;

    for (const order of orders) {
      for (const item of order.items) {
        if (item.status === OrderItemStatus.CANCELLED) continue;

        const recipe = await this.recipeRepo.find({
          where: { productId: item.productId },
          relations: ['ingredient'],
        });

        for (const line of recipe) {
          total += Number(line.quantity) * item.quantity * Number(line.ingredient.costPerUnit);
        }
      }
    }

    return total;
  }

  private async buildTopProductsReport(restaurantId: string, orders: Order[]) {
    const totals = new Map<
      string,
      { productId: string; productName: string; quantitySold: number; revenue: number; theoreticalCost: number }
    >();

    for (const order of orders) {
      for (const item of order.items) {
        if (item.status === OrderItemStatus.CANCELLED) continue;

        const current = totals.get(item.productId) ?? {
          productId: item.productId,
          productName: item.productName,
          quantitySold: 0,
          revenue: 0,
          theoreticalCost: 0,
        };

        current.quantitySold += item.quantity;
        current.revenue += Number(item.unitPrice) * item.quantity;

        const recipe = await this.recipeRepo.find({
          where: { productId: item.productId },
          relations: ['ingredient'],
        });

        for (const line of recipe) {
          current.theoreticalCost +=
            Number(line.quantity) * item.quantity * Number(line.ingredient.costPerUnit);
        }

        totals.set(item.productId, current);
      }
    }

    return [...totals.values()]
      .map((entry) => ({
        ...entry,
        marginPercent:
          entry.revenue > 0
            ? ((entry.revenue - entry.theoreticalCost) / entry.revenue) * 100
            : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }

  private async findIngredient(id: string, restaurantId: string) {
    const ingredient = await this.ingredientsRepo.findOne({ where: { id, restaurantId } });
    if (!ingredient) throw new NotFoundException('Ingrediente não encontrado');
    return ingredient;
  }

  private mapIngredient(ingredient: Ingredient): IngredientDto {
    const currentStock = Number(ingredient.currentStock);
    const minStock = Number(ingredient.minStock);
    const costPerUnit = Number(ingredient.costPerUnit);

    return {
      id: ingredient.id,
      name: ingredient.name,
      unit: ingredient.unit,
      costPerUnit,
      currentStock,
      minStock,
      active: ingredient.active,
      isLowStock: currentStock <= minStock,
      stockValue: currentStock * costPerUnit,
    };
  }

  private mapMovement(movement: StockMovement, ingredientName: string): StockMovementDto {
    const quantity = Number(movement.quantity);
    const unitCost = Number(movement.unitCost);

    return {
      id: movement.id,
      ingredientId: movement.ingredientId,
      ingredientName,
      type: movement.type,
      quantity,
      unitCost,
      totalCost: Math.abs(quantity) * unitCost,
      balanceAfter: Number(movement.balanceAfter),
      orderId: movement.orderId,
      notes: movement.notes,
      createdAt: movement.createdAt.toISOString(),
    };
  }

  private mapInventoryCount(count: InventoryCount): InventoryCountDto {
    return {
      id: count.id,
      notes: count.notes,
      totalVarianceCost: Number(count.totalVarianceCost),
      createdAt: count.createdAt.toISOString(),
      lines: (count.lines ?? []).map((line) => ({
        ingredientId: line.ingredientId,
        ingredientName: line.ingredientName,
        unit: line.unit,
        systemQuantity: Number(line.systemQuantity),
        physicalQuantity: Number(line.physicalQuantity),
        variance: Number(line.variance),
        varianceCost: Number(line.varianceCost),
      })),
    };
  }
}
