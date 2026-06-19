import type { MenuChannel } from '@pedidonamesa/shared';

export interface Category {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  active: boolean;
}

export interface AdminProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  categoryId: string;
  available: boolean;
  sortOrder: number;
  suggestedProductIds: string[];
  channels: MenuChannel[];
}

export interface TableRow {
  id: string;
  number: number;
  label: string | null;
  token: string;
  active: boolean;
}

export interface ProductFormValues {
  name: string;
  price: string;
  categoryId: string;
  description: string;
}

export interface TableFormValues {
  number: string;
  label: string;
}

export interface CategoryFormValues {
  name: string;
  description: string;
}
