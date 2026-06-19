import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  KITCHEN_ACTIVE_STATUSES,
  OrderItemStatus,
  OrderStatus,
} from '@pedidonamesa/shared';
import { Order, OrderItem, Product, Table } from '../entities';
import { CreateOrderDto, UpdateOrderItemStatusDto, UpdateOrderStatusDto } from './dto/order.dto';
import { mapOrder } from './order.mapper';
import { OrdersGateway } from '../websocket/orders.gateway';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemsRepo: Repository<OrderItem>,
    @InjectRepository(Table)
    private readonly tablesRepo: Repository<Table>,
    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,
    private readonly ordersGateway: OrdersGateway,
  ) {}

  async createFromTableToken(tableToken: string, dto: CreateOrderDto) {
    const table = await this.tablesRepo.findOne({
      where: { token: tableToken, active: true },
    });

    if (!table) {
      throw new NotFoundException('Mesa não encontrada');
    }

    const productIds = dto.items.map((i) => i.productId);
    const products = await this.productsRepo.find({
      where: { id: In(productIds), available: true },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('Um ou mais produtos não estão disponíveis');
    }

    const orderItems: Partial<OrderItem>[] = [];
    let total = 0;

    for (const item of dto.items) {
      const product = products.find((p) => p.id === item.productId)!;
      const unitPrice = Number(product.price);
      total += unitPrice * item.quantity;

      orderItems.push({
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice,
        notes: item.notes ?? null,
        status: OrderItemStatus.PENDING,
      });
    }

    const order = this.ordersRepo.create({
      tableId: table.id,
      restaurantId: table.restaurantId,
      status: OrderStatus.PENDING,
      notes: dto.notes ?? null,
      total,
      items: orderItems as OrderItem[],
    });

    const saved = await this.ordersRepo.save(order);
    const full = await this.findById(saved.id);

    const mapped = mapOrder(full, table);
    this.ordersGateway.emitOrderCreated(table.restaurantId, mapped);

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

    return orders.map((o) => mapOrder(o));
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

    return orders.map((o) => mapOrder(o));
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
    const derivedStatus = this.deriveOrderStatusFromItems(order.items);
    if (order.status !== derivedStatus && order.status !== OrderStatus.CANCELLED) {
      order.status = derivedStatus;
      await this.ordersRepo.save(order);
    }

    const full = await this.findById(item.orderId);
    const mapped = mapOrder(full);
    this.ordersGateway.emitOrderItemUpdated(restaurantId, mapped, item.id);

    return mapped;
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
    const active = items.filter((i) => i.status !== OrderItemStatus.CANCELLED);
    if (active.length === 0) return OrderStatus.CANCELLED;

    const allDelivered = active.every((i) => i.status === OrderItemStatus.DELIVERED);
    if (allDelivered) return OrderStatus.DELIVERED;

    const allReadyOrDelivered = active.every(
      (i) => i.status === OrderItemStatus.READY || i.status === OrderItemStatus.DELIVERED,
    );
    if (allReadyOrDelivered) return OrderStatus.READY;

    const anyPreparing = active.some(
      (i) => i.status === OrderItemStatus.PREPARING || i.status === OrderItemStatus.READY,
    );
    if (anyPreparing) return OrderStatus.PREPARING;

    return OrderStatus.PENDING;
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

  private async findById(id: string) {
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
