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
  const resolvedTable = table ?? order.table;
  return {
    id: order.id,
    tableId: order.tableId,
    tableNumber: resolvedTable?.number ?? 0,
    tableLabel: resolvedTable?.label ?? null,
    status: order.status,
    notes: order.notes,
    total: Number(order.total),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    items: (order.items ?? []).map(mapOrderItem),
  };
}
