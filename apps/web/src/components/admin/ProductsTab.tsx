import { memo, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ImagePlus, Package, Plus } from 'lucide-react';
import {
  useCategories,
  useCreateProduct,
  useProducts,
  useToggleProduct,
  useUploadProductImage,
} from '../../hooks/useAdmin';
import { formatCurrency, parsePriceInput } from '../../lib/utils';
import type { AdminProduct, Category, ProductFormValues } from '../../types/admin';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input, Select } from '../ui/Input';
import { ImageUpload } from '../ui/ImageUpload';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';

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
    <li className="flex items-center justify-between gap-4 px-4 py-4">
      <div className="flex min-w-0 items-center gap-3">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="h-12 w-12 shrink-0 rounded-lg object-cover ring-1 ring-zinc-200"
          />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-zinc-100">
            <ImagePlus className="h-4 w-4 text-zinc-400" />
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate font-medium text-zinc-900">{product.name}</p>
            <Badge variant={product.available ? 'success' : 'muted'}>
              {product.available ? 'Disponível' : 'Indisponível'}
            </Badge>
          </div>
          <p className="text-sm text-zinc-500">
            {formatCurrency(Number(product.price))} · {categoryName}
          </p>
          <label className="mt-1 inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700">
            <ImagePlus className="h-3 w-3" />
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
      <Button
        variant={product.available ? 'outline' : 'primary'}
        size="sm"
        disabled={isToggling}
        onClick={() => onToggle(product.id, !product.available)}
      >
        {product.available ? 'Desativar' : 'Ativar'}
      </Button>
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

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormValues>({
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
    return (
      <div className="space-y-3">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">Produtos</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Adicione itens ao cardápio com foto, preço e descrição.
        </p>
      </div>

      <Card>
        <form method="post" onSubmit={handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
          <div>
            <Input placeholder="Nome do produto" {...register('name', { required: true })} />
            {errors.name && <p className="mt-1 text-sm text-red-600">Informe o nome do produto</p>}
          </div>
          <div>
            <Input
              placeholder="Preço"
              type="number"
              step="0.01"
              min="0"
              {...register('price', {
                required: true,
                validate: (value) =>
                  !Number.isNaN(parsePriceInput(value)) && parsePriceInput(value) >= 0,
              })}
            />
            {errors.price && <p className="mt-1 text-sm text-red-600">Informe um preço válido</p>}
          </div>
          <Select {...register('categoryId', { required: true })}>
            {categories.map((c: Category) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Input placeholder="Descrição (opcional)" {...register('description')} />
          <div className="md:col-span-2">
            <ImageUpload
              value={productImage}
              previewUrl={productImagePreview}
              disabled={createProduct.isPending}
              onChange={handleImageChange}
            />
          </div>
          {createProduct.isError && (
            <p className="md:col-span-2 text-sm text-red-600">
              Não foi possível salvar o produto. Verifique os campos e tente novamente.
            </p>
          )}
          <div className="md:col-span-2">
            <Button type="submit" disabled={createProduct.isPending}>
              <Plus className="h-4 w-4" />
              {createProduct.isPending ? 'Salvando...' : 'Adicionar produto'}
            </Button>
          </div>
        </form>
      </Card>

      {products.length === 0 ? (
        <EmptyState
          icon={<Package className="h-5 w-5" />}
          title="Nenhum produto"
          description="Adicione produtos para montar o cardápio digital."
        />
      ) : (
        <ul className="divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 bg-white">
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
      )}
    </div>
  );
});
