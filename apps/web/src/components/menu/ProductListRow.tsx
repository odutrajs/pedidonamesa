import { memo } from 'react';
import { ChevronRight, UtensilsCrossed } from 'lucide-react';
import type { ProductDto } from '@pedidonamesa/shared';
import { getMinimumUnitPrice, isProductConfigurable } from '@pedidonamesa/shared';
import { formatCurrency } from '../../lib/utils';
import { cn } from '../../lib/cn';

interface ProductListRowProps {
  product: ProductDto;
  onSelect: (product: ProductDto) => void;
  showDivider?: boolean;
}

export const ProductListRow = memo(function ProductListRow({
  product,
  onSelect,
  showDivider = true,
}: ProductListRowProps) {
  const configurable = isProductConfigurable(product);
  const displayPrice = configurable ? getMinimumUnitPrice(product) : product.price;

  return (
    <button
      type="button"
      onClick={() => onSelect(product)}
      className={cn(
        'flex w-full items-stretch gap-3 px-4 py-3.5 text-left transition hover:bg-zinc-800/60 active:bg-zinc-800',
        showDivider && 'border-b border-zinc-800/80 last:border-b-0',
      )}
    >
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold leading-snug text-white">{product.name}</h3>
        {product.description && (
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-zinc-400">
            {product.description}
          </p>
        )}
        <p className="mt-2 text-sm font-semibold text-emerald-400">
          {configurable ? (
            <>
              a partir de <span className="text-base">{formatCurrency(displayPrice)}</span>
            </>
          ) : (
            <span className="text-base">{formatCurrency(displayPrice)}</span>
          )}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <div className="relative h-[72px] w-[72px] overflow-hidden rounded-xl bg-zinc-800">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <UtensilsCrossed className="h-6 w-6 text-zinc-600" />
            </div>
          )}
        </div>
        <ChevronRight className="hidden h-4 w-4 text-zinc-600 sm:block" />
      </div>
    </button>
  );
});
