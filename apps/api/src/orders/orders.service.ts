import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  CreateOrderResponse,
  isProductOnChannel,
  KITCHEN_ACTIVE_STATUSES,
  MenuChannel,
  OrderItemStatus,
  OrderStatus,
  parseProductChannels,
  PaymentMethod,
  PaymentMode,
  PaymentStatus,
  ProductDto,
  validateProductSelections,
} from '@pedidonamesa/shared';
import { Order, OrderItem, Table, Product, Restaurant } from '../entities';
import {
  CreateDeliveryOrderDto,
  CreateOrderDto,
  UpdateOrderItemStatusDto,
  UpdateOrderStatusDto,
} from './dto/order.dto';
import { mapOrder } from './order.mapper';
import { OrdersGateway } from '../websocket/orders.gateway';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemsRepo: Repository<OrderItem>,
    @InjectRepository(Table)
    private readonly tablesRepo: Repository<Table>,
    @InjectRepository(Restaurant)
    private readonly restaurantsRepo: Repository<Restaurant>,
    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,
    private readonly ordersGateway: OrdersGateway,
    private readonly inventoryService: InventoryService,
  ) {}

  async createFromTableToken(tableToken: string, dto: CreateOrderDto): Promise<CreateOrderResponse> {
    const table = await this.tablesRepo.findOne({
      where: { token: tableToken, active: true },
      relations: ['restaurant'],
    });

    if (!table) {
      throw new NotFoundException('Mesa não encontrada');
    }

    return this.createOrder({
      restaurant: table.restaurant,
      channel: MenuChannel.TABLE,
      dto,
      table,
    });
  }

  async createFromDeliverySlug(
    slug: string,
    dto: CreateDeliveryOrderDto,
  ): Promise<CreateOrderResponse> {
    const restaurant = await this.restaurantsRepo.findOne({
      where: { slug, active: true },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurante não encontrado');
    }

    return this.createOrder({
      restaurant,
      channel: MenuChannel.DELIVERY,
      dto,
      delivery: {
        customerName: dto.customerName.trim(),
        customerPhone: dto.customerPhone.trim(),
        deliveryAddress: dto.deliveryAddress.trim(),
      },
    });
  }

  private async createOrder(params: {
    restaurant: Restaurant;
    channel: MenuChannel;
    dto: CreateOrderDto;
    table?: Table;
    delivery?: {
      customerName: string;
      customerPhone: string;
      deliveryAddress: string;
    };
  }): Promise<CreateOrderResponse> {
    const { restaurant, channel, dto, table, delivery } = params;
    const productIds = dto.items.map((item) => item.productId);

    const products = await this.productsRepo
      .createQueryBuilder('product')
      .innerJoin('product.category', 'category')
      .where('product.id IN (:...productIds)', { productIds })
      .andWhere('category.restaurantId = :restaurantId', { restaurantId: restaurant.id })
      .andWhere('product.available = :available', { available: true })
      .getMany();

    if (products.length !== productIds.length) {
      throw new BadRequestException('Um ou mais produtos não estão disponíveis');
    }

    for (const product of products) {
      if (!isProductOnChannel(product, channel)) {
        throw new BadRequestException('Um ou mais produtos não estão disponíveis neste canal');
      }
    }

    const orderItems: Partial<OrderItem>[] = [];
    let total = 0;

    for (const item of dto.items) {
      const product = products.find((entry) => entry.id === item.productId)!;
      const productDto: ProductDto = {
        id: product.id,
        name: product.name,
        description: product.description,
        price: Number(product.price),
        imageUrl: product.imageUrl,
        available: product.available,
        sortOrder: product.sortOrder,
        categoryId: product.categoryId,
        suggestedProductIds: [],
        channels: parseProductChannels(product.channels),
        optionGroups: product.optionGroups ?? [],
      };

      const validation = validateProductSelections(productDto, item.selections ?? []);
      if (!validation.ok) {
        throw new BadRequestException(validation.message);
      }

      const unitPrice = validation.unitPrice;
      total += unitPrice * item.quantity;

      orderItems.push({
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice,
        notes: item.notes ?? null,
        selections: validation.selections,
        status: OrderItemStatus.PENDING,
      });
    }

    const paymentRequired = restaurant.paymentMode === PaymentMode.PAY_BEFORE;

    const order = this.ordersRepo.create({
      channel,
      tableId: table?.id ?? null,
      restaurantId: restaurant.id,
      customerName: delivery?.customerName ?? null,
      customerPhone: delivery?.customerPhone ?? null,
      deliveryAddress: delivery?.deliveryAddress ?? null,
      status: OrderStatus.PENDING,
      notes: dto.notes ?? null,
      total,
      paymentStatus: paymentRequired ? PaymentStatus.PENDING : PaymentStatus.NOT_REQUIRED,
      paymentMethod: null,
      stripePaymentIntentId: null,
      mercadoPagoPaymentId: null,
      paidAt: null,
      items: orderItems as OrderItem[],
    });

    const saved = await this.ordersRepo.save(order);
    const full = await this.findById(saved.id);
    const mapped = mapOrder(full, table ?? undefined);

    if (!paymentRequired) {
      this.ordersGateway.emitOrderCreated(restaurant.id, mapped);
    }

    return {
      order: mapped,
      paymentRequired,
    };
  }

  async markOrderPaid(
    orderId: string,
    paymentMethod: PaymentMethod,
    stripePaymentIntentId?: string,
  ) {
    const order = await this.findById(orderId);

    if (order.paymentStatus === PaymentStatus.PAID) {
      return mapOrder(order);
    }

    if (order.paymentStatus === PaymentStatus.NOT_REQUIRED) {
      throw new BadRequestException('Este pedido não exige pagamento antecipado');
    }

    order.paymentStatus = PaymentStatus.PAID;
    order.paymentMethod = paymentMethod;
    order.paidAt = new Date();
    if (stripePaymentIntentId) {
      order.stripePaymentIntentId = stripePaymentIntentId;
    }

    await this.ordersRepo.save(order);

    const full = await this.findById(order.id);
    const mapped = mapOrder(full);
    this.ordersGateway.emitOrderCreated(order.restaurantId, mapped);

    return mapped;
  }

  async getKitchenOrders(restaurantId: string) {
    const orders = await this.ordersRepo.find({
      where: {
        restaurantId,
        status: In(KITCHEN_ACTIVE_STATUSES),
      },
      relations: ['items', 'table'],
      order: { createdAt: 'ASC' },
    });

    return orders
      .filter((order) => this.isVisibleInKitchen(order))
      .map((order) => mapOrder(order));
  }

  async getActiveOrdersForRestaurant(restaurantId: string) {
    const orders = await this.ordersRepo.find({
      where: {
        restaurantId,
        status: In([
          OrderStatus.PENDING,
          OrderStatus.CONFIRMED,
          OrderStatus.PREPARING,
          OrderStatus.READY,
        ]),
      },
      relations: ['items', 'table'],
      order: { createdAt: 'DESC' },
    });

    return orders.map((order) => mapOrder(order));
  }

  async getRestaurantOrders(restaurantId: string, limit = 100) {
    const orders = await this.ordersRepo.find({
      where: { restaurantId },
      relations: ['items', 'table'],
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return orders.map((order) => mapOrder(order));
  }

  async updateOrderStatus(
    orderId: string,
    restaurantId: string,
    dto: UpdateOrderStatusDto,
  ) {
    const order = await this.findOrderForRestaurant(orderId, restaurantId);
    this.validateOrderStatusTransition(order.status, dto.status);

    order.status = dto.status;
    await this.ordersRepo.save(order);

    await this.handleStockForStatus(order, dto.status);

    if (
      dto.status === OrderStatus.PREPARING ||
      dto.status === OrderStatus.CANCELLED
    ) {
      await this.syncItemsWithOrderStatus(order, dto.status);
    }

    const full = await this.findById(order.id);
    const mapped = mapOrder(full);
    this.ordersGateway.emitOrderUpdated(restaurantId, mapped);

    return mapped;
  }

  async updateOrderItemStatus(
    itemId: string,
    restaurantId: string,
    dto: UpdateOrderItemStatusDto,
  ) {
    const item = await this.orderItemsRepo.findOne({
      where: { id: itemId },
      relations: ['order', 'order.table'],
    });

    if (!item || item.order.restaurantId !== restaurantId) {
      throw new NotFoundException('Item não encontrado');
    }

    item.status = dto.status;
    await this.orderItemsRepo.save(item);

    const order = await this.findById(item.orderId);
    const previousStatus = order.status;
    const derivedStatus = this.deriveOrderStatusFromItems(order.items);
    if (order.status !== derivedStatus && order.status !== OrderStatus.CANCELLED) {
      order.status = derivedStatus;
      await this.ordersRepo.save(order);
      if (derivedStatus !== previousStatus) {
        await this.handleStockForStatus(order, derivedStatus);
      }
    }

    const full = await this.findById(item.orderId);
    const mapped = mapOrder(full);
    this.ordersGateway.emitOrderItemUpdated(restaurantId, mapped, item.id);

    return mapped;
  }

  private async handleStockForStatus(order: Order, status: OrderStatus) {
    const fresh = await this.ordersRepo.findOne({ where: { id: order.id } });
    if (!fresh) return;

    if (status === OrderStatus.PREPARING && !fresh.stockDeducted) {
      await this.inventoryService.consumeForOrder(fresh.id);
    }

    if (status === OrderStatus.CANCELLED && fresh.stockDeducted) {
      await this.inventoryService.restoreForOrder(fresh.id);
    }
  }

  private async syncItemsWithOrderStatus(order: Order, status: OrderStatus) {
    const items = await this.orderItemsRepo.find({ where: { orderId: order.id } });

    for (const item of items) {
      if (item.status === OrderItemStatus.CANCELLED || item.status === OrderItemStatus.DELIVERED) {
        continue;
      }

      if (status === OrderStatus.CANCELLED) {
        item.status = OrderItemStatus.CANCELLED;
      } else if (status === OrderStatus.PREPARING) {
        item.status = OrderItemStatus.PREPARING;
      }

      await this.orderItemsRepo.save(item);
    }
  }

  private deriveOrderStatusFromItems(items: OrderItem[]): OrderStatus {
    const active = items.filter((item) => item.status !== OrderItemStatus.CANCELLED);
    if (active.length === 0) return OrderStatus.CANCELLED;

    const allDelivered = active.every((item) => item.status === OrderItemStatus.DELIVERED);
    if (allDelivered) return OrderStatus.DELIVERED;

    const allReadyOrDelivered = active.every(
      (item) => item.status === OrderItemStatus.READY || item.status === OrderItemStatus.DELIVERED,
    );
    if (allReadyOrDelivered) return OrderStatus.READY;

    const anyPreparing = active.some(
      (item) => item.status === OrderItemStatus.PREPARING || item.status === OrderItemStatus.READY,
    );
    if (anyPreparing) return OrderStatus.PREPARING;

    return OrderStatus.PENDING;
  }

  private isVisibleInKitchen(order: Order): boolean {
    return (
      order.paymentStatus === PaymentStatus.NOT_REQUIRED ||
      order.paymentStatus === PaymentStatus.PAID
    );
  }

  private validateOrderStatusTransition(current: OrderStatus, next: OrderStatus) {
    const allowed: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
      [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED],
      [OrderStatus.READY]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
      [OrderStatus.DELIVERED]: [],
      [OrderStatus.CANCELLED]: [],
    };

    if (!allowed[current]?.includes(next)) {
      throw new BadRequestException(`Transição inválida: ${current} → ${next}`);
    }
  }

  private async findOrderForRestaurant(orderId: string, restaurantId: string) {
    const order = await this.ordersRepo.findOne({
      where: { id: orderId, restaurantId },
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    return order;
  }

  async findById(id: string) {
    const order = await this.ordersRepo.findOne({
      where: { id },
      relations: ['items', 'table'],
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    return order;
  }
}
