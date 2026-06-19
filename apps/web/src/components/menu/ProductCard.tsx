import { memo } from 'react';
import { Plus, UtensilsCrossed } from 'lucide-react';
import type { ProductDto } from '@pedidonamesa/shared';
import { formatCurrency } from '../../lib/utils';
import { cn } from '../../lib/cn';

interface ProductCardProps {
  product: ProductDto;
  onAdd: (product: ProductDto) => void;
}

export const ProductCard = memo(function ProductCard({ product, onAdd }: ProductCardProps) {
  return (
    <article
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-xs transition',
        'hover:border-zinc-300 hover:shadow-sm',
        'dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700',
        'flex gap-3.5 p-3 sm:flex-col sm:gap-0 sm:p-0',
      )}
    >
      <div
        className={cn(
          'relative shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800',
          'h-[88px] w-[88px] sm:h-auto sm:w-full sm:rounded-none sm:rounded-t-2xl',
        )}
      >
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200/80 dark:from-zinc-800 dark:to-zinc-900">
            <UtensilsCrossed className="h-7 w-7 text-zinc-300 dark:text-zinc-600" />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5 sm:p-4">
        <div>
          <h3 className="font-semibold leading-snug text-zinc-900 dark:text-zinc-50">
            {product.name}
          </h3>
          {product.description && (
            <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              {product.description}
            </p>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between gap-2 sm:mt-3">
          <p className="text-base font-bold tabular-nums text-brand-600 dark:text-brand-400">
            {formatCurrency(product.price)}
          </p>
          <button
            type="button"
            onClick={() => onAdd(product)}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 rounded-full font-medium transition active:scale-95',
              'bg-brand-600 text-white hover:bg-brand-700',
              'h-9 w-9 sm:h-auto sm:w-auto sm:px-3.5 sm:py-2 sm:text-sm',
            )}
            aria-label={`Adicionar ${product.name}`}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Adicionar</span>
          </button>
        </div>
      </div>
    </article>
  );
});
