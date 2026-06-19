import { memo } from 'react';
import type { CategoryDto, ProductDto } from '@pedidonamesa/shared';
import { ProductListRow } from './ProductListRow';

interface ProductCategorySectionProps {
  category: CategoryDto;
  onSelectProduct: (product: ProductDto) => void;
  sectionRef?: (element: HTMLElement | null) => void;
}

export const ProductCategorySection = memo(function ProductCategorySection({
  category,
  onSelectProduct,
  sectionRef,
}: ProductCategorySectionProps) {
  return (
    <section
      id={`cat-${category.id}`}
      ref={sectionRef}
      className="section-scroll scroll-mt-36"
    >
      <h2 className="mb-3 px-1 text-lg font-bold text-white">{category.name}</h2>
      <div className="overflow-hidden rounded-2xl bg-zinc-900 ring-1 ring-zinc-800">
        {category.products.map((product, index) => (
          <ProductListRow
            key={product.id}
            product={product}
            onSelect={onSelectProduct}
            showDivider={index < category.products.length - 1}
          />
        ))}
      </div>
    </section>
  );
});
