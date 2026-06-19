import { memo } from 'react';
import type { ProductDto } from '@pedidonamesa/shared';
import { formatCurrency } from '../../lib/utils';

interface CartItem {
  product: ProductDto;
  quantity: number;
}

interface CartSidebarProps {
  cart: CartItem[];
  orderNotes: string;
  total: number;
  error: string;
  submitting: boolean;
  onNotesChange: (notes: string) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onSubmit: () => void;
}

export const CartSidebar = memo(function CartSidebar({
  cart,
  orderNotes,
  total,
  error,
  submitting,
  onNotesChange,
  onUpdateQuantity,
  onSubmit,
}: CartSidebarProps) {
  return (
    <aside className="card sticky top-24 p-4">
      <h2 className="text-lg font-bold">Seu pedido</h2>
      {cart.length === 0 ? (
        <p className="mt-3 text-sm text-stone-500">Adicione itens do cardápio</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {cart.map((item) => (
            <li key={item.product.id} className="flex items-center justify-between gap-2">
              <div>
                <p className="font-medium">{item.product.name}</p>
                <p className="text-sm text-stone-500">
                  {formatCurrency(item.product.price)} × {item.quantity}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="btn-secondary px-2 py-1"
                  onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                >
                  −
                </button>
                <span className="text-sm font-semibold">{item.quantity}</span>
                <button
                  className="btn-secondary px-2 py-1"
                  onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                >
                  +
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 border-t border-stone-200 pt-4">
        <label className="mb-1 block text-sm font-medium">Observações</label>
        <textarea
          className="input min-h-[72px]"
          placeholder="Ex: sem cebola, gelado..."
          value={orderNotes}
          onChange={(e) => onNotesChange(e.target.value)}
        />
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="font-semibold">Total</span>
        <span className="text-lg font-bold">{formatCurrency(total)}</span>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <button
        className="btn-primary mt-4 w-full"
        disabled={cart.length === 0 || submitting}
        onClick={onSubmit}
      >
        {submitting ? 'Enviando...' : 'Enviar pedido'}
      </button>
    </aside>
  );
});
