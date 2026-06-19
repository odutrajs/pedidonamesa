import { memo } from 'react';
import { Minus, Plus, ShoppingBag } from 'lucide-react';
import type { ProductDto } from '@pedidonamesa/shared';
import { formatCurrency } from '../../lib/utils';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { Label, Textarea } from '../ui/Input';

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
  onNotesChange: (notes: string) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onSubmit: () => void;
}

export const CartContent = memo(function CartContent({
  cart,
  orderNotes,
  total,
  error,
  submitting,
  submitLabel = 'Enviar pedido',
  onNotesChange,
  onUpdateQuantity,
  onSubmit,
}: CartContentProps) {
  return (
    <>
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Seu pedido</h2>

      {cart.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="h-5 w-5" />}
          title="Carrinho vazio"
          description="Adicione itens do cardápio para começar seu pedido."
          className="py-8"
        />
      ) : (
        <ul className="mt-4 space-y-3">
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
        disabled={cart.length === 0 || submitting}
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
  onNotesChange: (notes: string) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onSubmit: () => void;
}

export const CartSidebar = memo(function CartSidebar(props: CartSidebarProps) {
  return (
    <aside className="sticky top-20 hidden rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 lg:block">
      <CartContent {...props} />
    </aside>
  );
});
