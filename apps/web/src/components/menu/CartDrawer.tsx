import { memo } from 'react';
import { X } from 'lucide-react';
import type { ProductDto, UpsellSuggestionDto } from '@pedidonamesa/shared';
import { formatCurrency } from '../../lib/utils';
import { CartContent, type DeliveryFormValues } from './CartSidebar';

interface CartItem {
  product: ProductDto;
  quantity: number;
}

interface CartDrawerProps {
  open: boolean;
  cart: CartItem[];
  orderNotes: string;
  total: number;
  itemCount: number;
  error: string;
  submitting: boolean;
  upsellSuggestions?: UpsellSuggestionDto[];
  deliveryFields?: {
    values: DeliveryFormValues;
    onChange: (field: keyof DeliveryFormValues, value: string) => void;
  };
  onOpen: () => void;
  onClose: () => void;
  onNotesChange: (notes: string) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onAddProduct?: (product: ProductDto) => void;
  onSubmit: () => void;
}

export const CartDrawer = memo(function CartDrawer({
  open,
  cart,
  orderNotes,
  total,
  itemCount,
  error,
  submitting,
  upsellSuggestions,
  deliveryFields,
  onOpen,
  onClose,
  onNotesChange,
  onUpdateQuantity,
  onAddProduct,
  onSubmit,
}: CartDrawerProps) {
  return (
    <>
      {itemCount > 0 && !open && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white p-4 shadow-lg dark:border-zinc-800 dark:bg-zinc-900 lg:hidden">
          <button
            type="button"
            onClick={onOpen}
            className="flex w-full items-center justify-between rounded-xl bg-zinc-900 px-4 py-3.5 text-white transition active:scale-[0.98] dark:bg-zinc-100 dark:text-zinc-900"
          >
            <span className="text-sm font-medium">
              {itemCount} {itemCount === 1 ? 'item' : 'itens'}
            </span>
            <span className="text-sm font-semibold">{formatCurrency(total)}</span>
            <span className="text-sm font-medium">Ver pedido →</span>
          </button>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
            aria-label="Fechar carrinho"
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white p-5 pb-8 animate-slide-down dark:bg-zinc-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold dark:text-zinc-50">Seu pedido</h2>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <CartContent
              cart={cart}
              orderNotes={orderNotes}
              total={total}
              error={error}
              submitting={submitting}
              showTitle={false}
              upsellSuggestions={upsellSuggestions}
              deliveryFields={deliveryFields}
              onNotesChange={onNotesChange}
              onUpdateQuantity={onUpdateQuantity}
              onAddProduct={onAddProduct}
              onSubmit={onSubmit}
            />
          </div>
        </div>
      )}
    </>
  );
});
