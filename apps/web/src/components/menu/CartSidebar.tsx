import { memo } from 'react';
import { Minus, Plus, ShoppingBag } from 'lucide-react';
import type { ProductDto, UpsellSuggestionDto } from '@pedidonamesa/shared';
import { formatCurrency } from '../../lib/utils';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { Label, Textarea, Input } from '../ui/Input';
import { CartUpsellSection } from './CartUpsellSection';

export interface DeliveryFormValues {
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
}

interface CartItem {
  product: ProductDto;
  quantity: number;
}

interface CartContentProps {
  cart: CartItem[];
  orderNotes: string;
  total: number;
  error: string;
  submitting: boolean;
  submitLabel?: string;
  showTitle?: boolean;
  upsellSuggestions?: UpsellSuggestionDto[];
  deliveryFields?: {
    values: DeliveryFormValues;
    onChange: (field: keyof DeliveryFormValues, value: string) => void;
  };
  onNotesChange: (notes: string) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onAddProduct?: (product: ProductDto) => void;
  onSubmit: () => void;
}

export const CartContent = memo(function CartContent({
  cart,
  orderNotes,
  total,
  error,
  submitting,
  submitLabel = 'Enviar pedido',
  showTitle = true,
  upsellSuggestions = [],
  deliveryFields,
  onNotesChange,
  onUpdateQuantity,
  onAddProduct,
  onSubmit,
}: CartContentProps) {
  return (
    <>
      {showTitle && (
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Seu pedido</h2>
      )}

      {cart.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="h-5 w-5" />}
          title="Carrinho vazio"
          description="Adicione itens do cardápio para começar seu pedido."
          className={showTitle ? 'py-8' : 'py-4'}
        />
      ) : (
        <ul className={`space-y-3 ${showTitle ? 'mt-4' : ''}`}>
          {cart.map((item) => (
            <li
              key={item.product.id}
              className="flex items-center justify-between gap-3 border-b border-zinc-100 pb-3 last:border-0 dark:border-zinc-800"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-zinc-900 dark:text-zinc-50">{item.product.name}</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {formatCurrency(item.product.price)} × {item.quantity}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                  aria-label="Diminuir quantidade"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                  aria-label="Aumentar quantidade"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {onAddProduct && upsellSuggestions.length > 0 && (
        <CartUpsellSection suggestions={upsellSuggestions} onAdd={onAddProduct} />
      )}

      {deliveryFields && cart.length > 0 && (
        <div className="mt-4 space-y-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Dados para entrega</p>
          <div>
            <Label>Nome</Label>
            <Input
              placeholder="Seu nome"
              value={deliveryFields.values.customerName}
              onChange={(event) => deliveryFields.onChange('customerName', event.target.value)}
            />
          </div>
          <div>
            <Label>Telefone</Label>
            <Input
              placeholder="(11) 99999-9999"
              value={deliveryFields.values.customerPhone}
              onChange={(event) => deliveryFields.onChange('customerPhone', event.target.value)}
            />
          </div>
          <div>
            <Label>Endereço</Label>
            <Textarea
              placeholder="Rua, número, bairro, complemento..."
              value={deliveryFields.values.deliveryAddress}
              onChange={(event) => deliveryFields.onChange('deliveryAddress', event.target.value)}
            />
          </div>
        </div>
      )}

      <div className="mt-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <Label>Observações</Label>
        <Textarea
          placeholder="Ex: sem cebola, gelado..."
          value={orderNotes}
          onChange={(e) => onNotesChange(e.target.value)}
        />
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="font-medium text-zinc-700 dark:text-zinc-300">Total</span>
        <span className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">{formatCurrency(total)}</span>
      </div>

      {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

      <Button
        className="mt-4 w-full"
        disabled={
          cart.length === 0 ||
          submitting ||
          (deliveryFields &&
            (!deliveryFields.values.customerName.trim() ||
              !deliveryFields.values.customerPhone.trim() ||
              !deliveryFields.values.deliveryAddress.trim()))
        }
        onClick={onSubmit}
      >
        {submitting ? 'Enviando...' : submitLabel}
      </Button>
    </>
  );
});

interface CartSidebarProps {
  cart: CartItem[];
  orderNotes: string;
  total: number;
  error: string;
  submitting: boolean;
  submitLabel?: string;
  upsellSuggestions?: UpsellSuggestionDto[];
  deliveryFields?: {
    values: DeliveryFormValues;
    onChange: (field: keyof DeliveryFormValues, value: string) => void;
  };
  onNotesChange: (notes: string) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onAddProduct?: (product: ProductDto) => void;
  onSubmit: () => void;
}

export const CartSidebar = memo(function CartSidebar(props: CartSidebarProps) {
  return (
    <aside className="sticky top-20 hidden rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 lg:block">
      <CartContent {...props} />
    </aside>
  );
});
