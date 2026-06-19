export const queryKeys = {
  categories: ['admin', 'categories'] as const,
  products: ['admin', 'products'] as const,
  tables: ['admin', 'tables'] as const,
  orders: ['admin', 'orders'] as const,
  settings: ['admin', 'settings'] as const,
  menu: (token: string) => ['menu', token] as const,
  kitchenOrders: ['kitchen', 'orders'] as const,
};
