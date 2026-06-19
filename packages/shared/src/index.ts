export enum MenuChannel {
  TABLE = 'TABLE',
  DELIVERY = 'DELIVERY',
}

export const MENU_CHANNEL_LABELS: Record<MenuChannel, string> = {
  [MenuChannel.TABLE]: 'Salão / QR',
  [MenuChannel.DELIVERY]: 'Delivery',
};

export function parseProductChannels(
  raw: string | string[] | null | undefined,
): MenuChannel[] {
  if (!raw || (Array.isArray(raw) && raw.length === 0)) {
    return [MenuChannel.TABLE, MenuChannel.DELIVERY];
  }

  const values = Array.isArray(raw) ? raw : raw.split(',');
  return values
    .map((value) => value.trim())
    .filter((value): value is MenuChannel =>
      Object.values(MenuChannel).includes(value as MenuChannel),
    );
}

export function isProductOnChannel(
  product: { channels?: string | string[] | null },
  channel: MenuChannel,
): boolean {
  return parseProductChannels(product.channels ?? undefined).includes(channel);
}

export enum UserRole {
  ADMIN = 'ADMIN',
  KITCHEN = 'KITCHEN',
  WAITER = 'WAITER',
}

export enum PaymentMode {
  PAY_BEFORE = 'PAY_BEFORE',
  PAY_AFTER = 'PAY_AFTER',
}

export enum PaymentStatus {
  NOT_REQUIRED = 'NOT_REQUIRED',
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
}

export enum PaymentMethod {
  PIX = 'PIX',
  CARD = 'CARD',
  APPLE_PAY = 'APPLE_PAY',
  GOOGLE_PAY = 'GOOGLE_PAY',
}

export const PAYMENT_MODE_LABELS: Record<PaymentMode, string> = {
  [PaymentMode.PAY_BEFORE]: 'Pagamento antes do pedido',
  [PaymentMode.PAY_AFTER]: 'Pagamento após o pedido',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  [PaymentStatus.NOT_REQUIRED]: 'Não exigido',
  [PaymentStatus.PENDING]: 'Aguardando pagamento',
  [PaymentStatus.PAID]: 'Pago',
  [PaymentStatus.FAILED]: 'Falhou',
};

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

export interface ProductOptionDto {
  id: string;
  name: string;
  description?: string | null;
  priceDelta: number;
}

export interface ProductOptionGroupDto {
  id: string;
  name: string;
  minSelections: number;
  maxSelections: number;
  required: boolean;
  options: ProductOptionDto[];
}

export interface OrderItemSelectionDto {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  priceDelta: number;
}

export interface ProductDto {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  available: boolean;
  sortOrder: number;
  categoryId: string;
  suggestedProductIds: string[];
  channels: MenuChannel[];
  optionGroups?: ProductOptionGroupDto[];
}

export interface UpsellSuggestionDto {
  product: ProductDto;
  reason: 'product' | 'food_only' | 'drinks_only';
}

export interface UpsellConfigDto {
  drinkCategoryId: string | null;
  foodOnlyEnabled: boolean;
  foodOnlyCategoryId: string | null;
  drinksOnlyEnabled: boolean;
  drinksOnlyCategoryId: string | null;
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
  selections: OrderItemSelectionDto[];
}

export interface OrderDto {
  id: string;
  channel: MenuChannel;
  tableId: string | null;
  tableNumber: number | null;
  tableLabel: string | null;
  customerName: string | null;
  customerPhone: string | null;
  deliveryAddress: string | null;
  status: OrderStatus;
  notes: string | null;
  total: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItemDto[];
}

export interface CreateOrderResponse {
  order: OrderDto;
  paymentRequired: boolean;
}

export interface MenuDto {
  channel: MenuChannel;
  restaurant: {
    id: string;
    name: string;
    slug: string;
    paymentMode: PaymentMode;
  };
  payment: {
    stripePublishableKey: string | null;
  };
  table: TableDto | null;
  categories: CategoryDto[];
  upsell: UpsellConfigDto;
}

export interface RestaurantSettingsDto {
  id: string;
  name: string;
  slug: string;
  paymentMode: PaymentMode;
  upsellDrinkCategoryId: string | null;
  upsellFoodOnlyEnabled: boolean;
  upsellFoodOnlyCategoryId: string | null;
  upsellDrinksOnlyEnabled: boolean;
  upsellDrinksOnlyCategoryId: string | null;
}

export interface StripeCheckoutDto {
  clientSecret: string;
  publishableKey: string;
}

export interface PixCheckoutDto {
  paymentId: string;
  qrCode: string;
  qrCodeBase64: string;
  expiresAt: string | null;
}

export interface PaymentStatusDto {
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod | null;
  paidAt: string | null;
  orderStatus: OrderStatus;
}

export interface CreateOrderItemSelectionInput {
  groupId: string;
  optionId: string;
}

export interface CreateOrderItemInput {
  productId: string;
  quantity: number;
  notes?: string;
  selections?: CreateOrderItemSelectionInput[];
}

export interface CreateOrderInput {
  items: CreateOrderItemInput[];
  notes?: string;
}

export interface CreateDeliveryOrderInput extends CreateOrderInput {
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
}

export {
  buildCartLineId,
  formatSelectionSummary,
  getMinimumUnitPrice,
  isProductConfigurable,
  validateProductSelections,
} from './product-options.js';
export type { SelectedOptionInput } from './product-options.js';

export const WS_EVENTS = {
  ORDER_CREATED: 'order:created',
  ORDER_UPDATED: 'order:updated',
  ORDER_ITEM_UPDATED: 'order:item:updated',
  KITCHEN_JOIN: 'kitchen:join',
} as const;
