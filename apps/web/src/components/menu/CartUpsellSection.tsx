import { memo } from 'react';
import { Plus, UtensilsCrossed } from 'lucide-react';
import type { ProductDto, UpsellSuggestionDto } from '@pedidonamesa/shared';
import { formatCurrency } from '../../lib/utils';
import { Button } from '../ui/Button';

interface CartUpsellSectionProps {
  suggestions: UpsellSuggestionDto[];
  onAdd: (product: ProductDto) => void;
}

function UpsellProductImage({ product }: { product: ProductDto }) {
  if (product.imageUrl) {
    return (
      <img
        src={product.imageUrl}
        alt={product.name}
        loading="lazy"
        decoding="async"
        className="h-14 w-14 shrink-0 rounded-lg object-cover ring-1 ring-zinc-200 dark:ring-zinc-700"
      />
    );
  }

  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-zinc-100 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:ring-zinc-700">
      <UtensilsCrossed className="h-5 w-5 text-zinc-400 dark:text-zinc-500" />
    </div>
  );
}

export const CartUpsellSection = memo(function CartUpsellSection({
  suggestions,
  onAdd,
}: CartUpsellSectionProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-600 dark:bg-zinc-800/90">
      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Que tal adicionar?</p>
      <ul className="mt-3 space-y-2">
        {suggestions.map(({ product, reason }) => (
          <li
            key={product.id}
            className="flex items-center gap-3 rounded-lg border border-zinc-100 bg-white px-3 py-2.5 dark:border-zinc-600/80 dark:bg-zinc-900"
          >
            <UpsellProductImage product={product} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {product.name}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {formatCurrency(product.price)}
                {reason !== 'product' ? ' · combina com seu pedido' : ''}
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="primary"
              className="shrink-0"
              onClick={() => onAdd(product)}
            >
              <Plus className="h-3.5 w-3.5" />
              Adicionar
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
});
