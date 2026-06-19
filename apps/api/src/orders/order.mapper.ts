import { Order, OrderItem, Table } from '../entities';
import { OrderDto, OrderItemDto } from '@pedidonamesa/shared';

export function mapOrderItem(item: OrderItem): OrderItemDto {
  return {
    id: item.id,
    productId: item.productId,
    productName: item.productName,
    quantity: item.quantity,
    unitPrice: Number(item.unitPrice),
    notes: item.notes,
    status: item.status,
  };
}

export function mapOrder(order: Order, table?: Table): OrderDto {
  const resolvedTable = table ?? order.table ?? undefined;
  return {
    id: order.id,
    channel: order.channel,
    tableId: order.tableId,
    tableNumber: resolvedTable?.number ?? null,
    tableLabel: resolvedTable?.label ?? null,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    deliveryAddress: order.deliveryAddress,
    status: order.status,
    notes: order.notes,
    total: Number(order.total),
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    paidAt: order.paidAt?.toISOString() ?? null,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    items: (order.items ?? []).map(mapOrderItem),
  };
}
