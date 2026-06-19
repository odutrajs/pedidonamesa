import { memo } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import type { ProductDto, UpsellSuggestionDto } from '@pedidonamesa/shared';
import { formatCurrency } from '../../lib/utils';
import { CartContent, type DeliveryFormValues } from './CartSidebar';
import type { CartLineItem } from '../../types/cart';

interface CartDrawerProps {
  open: boolean;
  cart: CartLineItem[];
  orderNotes: string;
  total: number;
  itemCount: number;
  error: string;
  submitting: boolean;
  submitLabel?: string;
  upsellSuggestions?: UpsellSuggestionDto[];
  deliveryFields?: {
    values: DeliveryFormValues;
    onChange: (field: keyof DeliveryFormValues, value: string) => void;
  };
  onOpen: () => void;
  onClose: () => void;
  onNotesChange: (notes: string) => void;
  onUpdateQuantity: (lineId: string, quantity: number) => void;
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
  submitLabel,
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
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-800 bg-zinc-950 p-4 lg:hidden">
          <button
            type="button"
            onClick={onOpen}
            className="flex w-full items-center justify-between rounded-xl bg-emerald-500 px-4 py-4 text-white shadow-lg transition active:scale-[0.98] hover:bg-emerald-600"
          >
            <span className="text-sm font-semibold">
              {itemCount} {itemCount === 1 ? 'item' : 'itens'}
            </span>
            <span className="text-sm font-bold">{formatCurrency(total)}</span>
            <span className="text-sm font-semibold">Ver carrinho →</span>
          </button>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950 lg:hidden">
          <header className="flex items-center gap-3 border-b border-zinc-800 px-4 py-4">
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center text-brand-400"
              aria-label="Voltar"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h2 className="flex-1 text-center text-lg font-semibold text-white">
              Carrinho de compras
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center text-zinc-400"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </header>
          <div className="flex-1 overflow-y-auto p-4 pb-8">
            <CartContent
              cart={cart}
              orderNotes={orderNotes}
              total={total}
              error={error}
              submitting={submitting}
              submitLabel={submitLabel}
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
