import { memo, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  useCategories,
  useCreateProduct,
  useProducts,
  useToggleProduct,
  useUploadProductImage,
} from '../../hooks/useAdmin';
import { formatCurrency } from '../../lib/utils';
import type { AdminProduct, Category, ProductFormValues } from '../../types/admin';

const ProductRow = memo(function ProductRow({
  product,
  categoryName,
  onToggle,
  onUploadImage,
  isToggling,
  isUploading,
}: {
  product: AdminProduct;
  categoryName: string;
  onToggle: (id: string, available: boolean) => void;
  onUploadImage: (id: string, file: File) => void;
  isToggling: boolean;
  isUploading: boolean;
}) {
  return (
    <li className="card flex items-center justify-between gap-3 p-4">
      <div className="flex items-center gap-3">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="h-14 w-14 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-xs text-stone-400">
            Sem foto
          </div>
        )}
        <div>
          <p className="font-semibold">{product.name}</p>
          <p className="text-sm text-stone-500">
            {formatCurrency(Number(product.price))} · {categoryName}
          </p>
          <label className="mt-1 inline-block cursor-pointer text-xs font-medium text-brand-700">
            {isUploading ? 'Enviando...' : product.imageUrl ? 'Trocar imagem' : 'Adicionar imagem'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              disabled={isUploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUploadImage(product.id, file);
                e.target.value = '';
              }}
            />
          </label>
        </div>
      </div>
      <button
        className={product.available ? 'btn-secondary' : 'btn-primary'}
        disabled={isToggling}
        onClick={() => onToggle(product.id, !product.available)}
      >
        {product.available ? 'Desativar' : 'Ativar'}
      </button>
    </li>
  );
});

export const ProductsTab = memo(function ProductsTab() {
  const { data: categories = [], isLoading: loadingCategories } = useCategories();
  const { data: products = [], isLoading: loadingProducts } = useProducts();
  const createProduct = useCreateProduct();
  const uploadImage = useUploadProductImage();
  const toggleProduct = useToggleProduct();

  const [productImage, setProductImage] = useState<File | null>(null);
  const [productImagePreview, setProductImagePreview] = useState<string | null>(null);

  const { register, handleSubmit, reset, setValue, watch } = useForm<ProductFormValues>({
    defaultValues: { name: '', price: '', categoryId: '', description: '' },
  });

  const categoryId = watch('categoryId');

  useEffect(() => {
    if (categories[0] && !categoryId) {
      setValue('categoryId', categories[0].id);
    }
  }, [categories, categoryId, setValue]);

  const categoryMap = useMemo(
    () => new Map(categories.map((c: Category) => [c.id, c.name])),
    [categories],
  );

  function handleImageChange(file: File | null) {
    setProductImage(file);
    if (productImagePreview) {
      URL.revokeObjectURL(productImagePreview);
    }
    setProductImagePreview(file ? URL.createObjectURL(file) : null);
  }

  function onSubmit(data: ProductFormValues) {
    createProduct.mutate(
      { data, image: productImage },
      {
        onSuccess: () => {
          reset({ name: '', price: '', categoryId: data.categoryId, description: '' });
          setProductImage(null);
          if (productImagePreview) URL.revokeObjectURL(productImagePreview);
          setProductImagePreview(null);
        },
      },
    );
  }

  if (loadingCategories || loadingProducts) {
    return <p className="text-stone-500">Carregando produtos...</p>;
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit(onSubmit)} className="card grid gap-3 p-4 md:grid-cols-2">
        <input className="input" placeholder="Nome do produto" {...register('name')} />
        <input
          className="input"
          placeholder="Preço"
          type="number"
          step="0.01"
          {...register('price')}
        />
        <select className="input" {...register('categoryId')}>
          {categories.map((c: Category) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input className="input" placeholder="Descrição" {...register('description')} />
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium">Imagem do produto</label>
          <input
            className="input"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(e) => handleImageChange(e.target.files?.[0] ?? null)}
          />
          {productImagePreview && (
            <img
              src={productImagePreview}
              alt="Prévia"
              className="mt-2 h-24 w-24 rounded-lg object-cover"
            />
          )}
        </div>
        <button className="btn-primary md:col-span-2" disabled={createProduct.isPending}>
          {createProduct.isPending ? 'Salvando...' : 'Adicionar produto'}
        </button>
      </form>
      <ul className="space-y-2">
        {products.map((p: AdminProduct) => (
          <ProductRow
            key={p.id}
            product={p}
            categoryName={categoryMap.get(p.categoryId) ?? '—'}
            onToggle={(id, available) => toggleProduct.mutate({ id, available })}
            onUploadImage={(id, file) => uploadImage.mutate({ productId: id, file })}
            isToggling={toggleProduct.isPending}
            isUploading={uploadImage.isPending && uploadImage.variables?.productId === p.id}
          />
        ))}
      </ul>
    </div>
  );
});
