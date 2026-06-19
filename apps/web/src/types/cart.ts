import type { OrderItemSelectionDto, ProductDto } from '@pedidonamesa/shared';

export interface CartLineItem {
  lineId: string;
  product: ProductDto;
  quantity: number;
  unitPrice: number;
  selections: OrderItemSelectionDto[];
}
