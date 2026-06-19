import { memo } from 'react';
import { Plus, UtensilsCrossed } from 'lucide-react';
import type { ProductDto } from '@pedidonamesa/shared';
import { formatCurrency } from '../../lib/utils';
import { Button } from '../ui/Button';

interface ProductCardProps {
  product: ProductDto;
  onAdd: (product: ProductDto) => void;
}

export const ProductCard = memo(function ProductCard({ product, onAdd }: ProductCardProps) {
  return (
    <article className="group overflow-hidden rounded-xl border border-zinc-200 bg-white transition hover:border-zinc-300 hover:shadow-sm">
      {product.imageUrl ? (
        <img
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
          decoding="async"
          className="aspect-[4/3] w-full object-cover"
        />
      ) : (
        <div className="flex aspect-[4/3] w-full items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100">
          <UtensilsCrossed className="h-8 w-8 text-zinc-300" />
        </div>
      )}
      <div className="p-4">
        <h3 className="font-medium text-zinc-900">{product.name}</h3>
        {product.description && (
          <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{product.description}</p>
        )}
        <div className="mt-3 flex items-center justify-between gap-2">
          <p className="text-base font-semibold text-brand-600">{formatCurrency(product.price)}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAdd(product)}
            className="group-hover:border-brand-300 group-hover:text-brand-700"
          >
            <Plus className="h-3.5 w-3.5" />
            Adicionar
          </Button>
        </div>
      </div>
    </article>
  );
});
