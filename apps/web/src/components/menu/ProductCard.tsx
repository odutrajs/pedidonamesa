import { memo } from 'react';
import type { ProductDto } from '@pedidonamesa/shared';
import { formatCurrency } from '../../lib/utils';

interface ProductCardProps {
  product: ProductDto;
  onAdd: (product: ProductDto) => void;
}

export const ProductCard = memo(function ProductCard({ product, onAdd }: ProductCardProps) {
  return (
    <article className="card overflow-hidden p-0">
      {product.imageUrl && (
        <img
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
          decoding="async"
          className="h-36 w-full object-cover"
        />
      )}
      <div className="flex items-start justify-between gap-3 p-4">
        <div>
          <h3 className="font-semibold">{product.name}</h3>
          {product.description && (
            <p className="mt-1 text-sm text-stone-500">{product.description}</p>
          )}
          <p className="mt-2 font-bold text-brand-700">{formatCurrency(product.price)}</p>
        </div>
        <button className="btn-primary shrink-0" onClick={() => onAdd(product)}>
          +
        </button>
      </div>
    </article>
  );
});
