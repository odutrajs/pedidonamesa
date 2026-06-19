export enum UserRole {
  ADMIN = 'ADMIN',
  KITCHEN = 'KITCHEN',
  WAITER = 'WAITER',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum OrderItemStatus {
  PENDING = 'PENDING',
  PREPARING = 'PREPARING',
  READY = 'READY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'Novo',
  [OrderStatus.CONFIRMED]: 'Confirmado',
  [OrderStatus.PREPARING]: 'Preparando',
  [OrderStatus.READY]: 'Pronto',
  [OrderStatus.DELIVERED]: 'Entregue',
  [OrderStatus.CANCELLED]: 'Cancelado',
};

export const ORDER_ITEM_STATUS_LABELS: Record<OrderItemStatus, string> = {
  [OrderItemStatus.PENDING]: 'Pendente',
  [OrderItemStatus.PREPARING]: 'Preparando',
  [OrderItemStatus.READY]: 'Pronto',
  [OrderItemStatus.DELIVERED]: 'Entregue',
  [OrderItemStatus.CANCELLED]: 'Cancelado',
};

export const KITCHEN_ACTIVE_STATUSES: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.READY,
];

export const KITCHEN_ACTIVE_ITEM_STATUSES: OrderItemStatus[] = [
  OrderItemStatus.PENDING,
  OrderItemStatus.PREPARING,
  OrderItemStatus.READY,
];

export interface ProductDto {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  available: boolean;
  sortOrder: number;
  categoryId: string;
}

export interface CategoryDto {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  active: boolean;
  products: ProductDto[];
}

export interface TableDto {
  id: string;
  number: number;
  label: string | null;
  token: string;
  active: boolean;
}

export interface OrderItemDto {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  notes: string | null;
  status: OrderItemStatus;
}

export interface OrderDto {
  id: string;
  tableId: string;
  tableNumber: number;
  tableLabel: string | null;
  status: OrderStatus;
  notes: string | null;
  total: number;
  createdAt: string;
  updatedAt: string;
  items: OrderItemDto[];
}

export interface MenuDto {
  restaurant: {
    id: string;
    name: string;
    slug: string;
  };
  table: TableDto;
  categories: CategoryDto[];
}

export interface CreateOrderItemInput {
  productId: string;
  quantity: number;
  notes?: string;
}

export interface CreateOrderInput {
  items: CreateOrderItemInput[];
  notes?: string;
}

export const WS_EVENTS = {
  ORDER_CREATED: 'order:created',
  ORDER_UPDATED: 'order:updated',
  ORDER_ITEM_UPDATED: 'order:item:updated',
  KITCHEN_JOIN: 'kitchen:join',
} as const;
