import { memo } from 'react';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import type { ProductDto, UpsellSuggestionDto } from '@pedidonamesa/shared';
import { formatCurrency } from '../../lib/utils';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { Label, Textarea, Input } from '../ui/Input';
import { CartUpsellSection } from './CartUpsellSection';
import type { CartLineItem } from '../../types/cart';

export interface DeliveryFormValues {
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
}

interface CartContentProps {
  cart: CartLineItem[];
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
  onUpdateQuantity: (lineId: string, quantity: number) => void;
  onAddProduct?: (product: ProductDto) => void;
  onSubmit: () => void;
}

function CartLineSelections({ item }: { item: CartLineItem }) {
  if (item.selections.length === 0) return null;

  return (
    <ul className="mt-2 space-y-1">
      {item.selections.map((selection, index) => (
        <li key={`${selection.groupId}-${selection.optionId}`} className="flex items-start gap-2">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold text-zinc-300">
            {index + 1}
          </span>
          <span className="text-sm text-zinc-400">{selection.optionName}</span>
        </li>
      ))}
    </ul>
  );
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
        <h2 className="text-lg font-semibold text-white">Carrinho de compras</h2>
      )}

      {cart.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="h-5 w-5" />}
          title="Carrinho vazio"
          description="Adicione itens do cardápio para começar seu pedido."
          className={showTitle ? 'py-8' : 'py-4'}
        />
      ) : (
        <ul className={`space-y-4 ${showTitle ? 'mt-4' : ''}`}>
          {cart.map((item) => (
            <li
              key={item.lineId}
              className="rounded-xl bg-zinc-900 p-3 ring-1 ring-zinc-800"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-white">{item.product.name}</p>
                  <p className="mt-0.5 text-sm font-semibold text-brand-400">
                    {formatCurrency(item.unitPrice * item.quantity)}
                  </p>
                  <CartLineSelections item={item} />
                </div>
                <div className="flex shrink-0 items-center gap-1 rounded-full bg-zinc-800 px-1 py-1">
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-brand-400 transition hover:bg-zinc-700"
                    onClick={() => onUpdateQuantity(item.lineId, item.quantity - 1)}
                    aria-label="Diminuir quantidade"
                  >
                    {item.quantity === 1 ? (
                      <Trash2 className="h-4 w-4" />
                    ) : (
                      <Minus className="h-4 w-4" />
                    )}
                  </button>
                  <span className="w-6 text-center text-sm font-semibold text-white">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-white transition hover:bg-zinc-700"
                    onClick={() => onUpdateQuantity(item.lineId, item.quantity + 1)}
                    aria-label="Aumentar quantidade"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {onAddProduct && upsellSuggestions.length > 0 && (
        <CartUpsellSection suggestions={upsellSuggestions} onAdd={onAddProduct} />
      )}

      {deliveryFields && cart.length > 0 && (
        <div className="mt-4 space-y-3 rounded-xl bg-zinc-900 p-4 ring-1 ring-zinc-800">
          <p className="text-sm font-semibold text-white">Informe seu nome e telefone</p>
          <div>
            <Label>Nome completo</Label>
            <Input
              placeholder="Seu nome"
              value={deliveryFields.values.customerName}
              onChange={(event) => deliveryFields.onChange('customerName', event.target.value)}
            />
          </div>
          <div>
            <Label>Número de celular</Label>
            <Input
              placeholder="(11) 99999-9999"
              value={deliveryFields.values.customerPhone}
              onChange={(event) => deliveryFields.onChange('customerPhone', event.target.value)}
            />
          </div>
          <div>
            <Label>Endereço de entrega</Label>
            <Textarea
              placeholder="Rua, número, bairro, complemento..."
              value={deliveryFields.values.deliveryAddress}
              onChange={(event) => deliveryFields.onChange('deliveryAddress', event.target.value)}
            />
          </div>
        </div>
      )}

      {cart.length > 0 && (
        <div className="mt-4 rounded-xl bg-zinc-900 p-4 ring-1 ring-zinc-800">
          <Label>Observações</Label>
          <Textarea
            placeholder="Ex: sem cebola, gelado..."
            value={orderNotes}
            onChange={(e) => onNotesChange(e.target.value)}
          />
        </div>
      )}

      {cart.length > 0 && (
        <div className="mt-4 flex items-center justify-between px-1">
          <span className="font-medium text-zinc-400">Total</span>
          <span className="text-xl font-bold text-white">{formatCurrency(total)}</span>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      <Button
        className="mt-4 w-full bg-emerald-500 hover:bg-emerald-600"
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
        {submitting ? 'Enviando...' : `${submitLabel}${cart.length > 0 ? ` ${formatCurrency(total)}` : ''}`}
      </Button>
    </>
  );
});

interface CartSidebarProps {
  cart: CartLineItem[];
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
  onUpdateQuantity: (lineId: string, quantity: number) => void;
  onAddProduct?: (product: ProductDto) => void;
  onSubmit: () => void;
}

export const CartSidebar = memo(function CartSidebar(props: CartSidebarProps) {
  return (
    <aside className="sticky top-20 hidden rounded-2xl bg-zinc-900 p-5 ring-1 ring-zinc-800 lg:block">
      <CartContent {...props} />
    </aside>
  );
});
