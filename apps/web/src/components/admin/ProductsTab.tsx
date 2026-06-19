import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ImagePlus, Package, Pencil, Plus } from 'lucide-react';
import {
  useCategories,
  useCreateProduct,
  useProducts,
  useToggleProduct,
  useUpdateProduct,
  useUploadProductImage,
} from '../../hooks/useAdmin';
import { formatCurrency } from '../../lib/utils';
import {
  categoryIdRules,
  formConfig,
  priceRules,
  productNameRules,
} from '../../lib/validation';
import type { AdminProduct, Category, ProductFormValues } from '../../types/admin';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { FieldError, Input, Select } from '../ui/Input';
import { ImageUpload } from '../ui/ImageUpload';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';

const ProductRow = memo(function ProductRow({
  product,
  categoryName,
  isEditing,
  onEdit,
  onToggle,
  onUploadImage,
  isToggling,
  isUploading,
}: {
  product: AdminProduct;
  categoryName: string;
  isEditing: boolean;
  onEdit: (product: AdminProduct) => void;
  onToggle: (id: string, available: boolean) => void;
  onUploadImage: (id: string, file: File) => void;
  isToggling: boolean;
  isUploading: boolean;
}) {
  return (
    <li
      className={`flex items-center justify-between gap-4 px-4 py-4 ${
        isEditing ? 'bg-brand-50/60 dark:bg-brand-950/40' : ''
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="h-12 w-12 shrink-0 rounded-lg object-cover ring-1 ring-zinc-200 dark:ring-zinc-700"
          />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
            <ImagePlus className="h-4 w-4 text-zinc-400" />
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate font-medium text-zinc-900 dark:text-zinc-50">{product.name}</p>
            <Badge variant={product.available ? 'success' : 'muted'}>
              {product.available ? 'Disponível' : 'Indisponível'}
            </Badge>
            {isEditing && <Badge variant="muted">Editando</Badge>}
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {formatCurrency(Number(product.price))} · {categoryName}
          </p>
          <label className="mt-1 inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300">
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
      <div className="flex shrink-0 items-center gap-2">
        <Button variant="outline" size="sm" disabled={isEditing} onClick={() => onEdit(product)}>
          <Pencil className="h-3.5 w-3.5" />
          Editar
        </Button>
        <Button
          variant={product.available ? 'outline' : 'primary'}
          size="sm"
          disabled={isToggling}
          onClick={() => onToggle(product.id, !product.available)}
        >
          {product.available ? 'Desativar' : 'Ativar'}
        </Button>
      </div>
    </li>
  );
});

export const ProductsTab = memo(function ProductsTab() {
  const formRef = useRef<HTMLDivElement>(null);
  const { data: categories = [], isLoading: loadingCategories } = useCategories();
  const { data: products = [], isLoading: loadingProducts } = useProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const uploadImage = useUploadProductImage();
  const toggleProduct = useToggleProduct();

  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productImage, setProductImage] = useState<File | null>(null);
  const [productImagePreview, setProductImagePreview] = useState<string | null>(null);

  const isEditing = editingProductId !== null;
  const isSaving = createProduct.isPending || updateProduct.isPending;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<ProductFormValues>({
    ...formConfig,
    defaultValues: { name: '', price: '', categoryId: '', description: '' },
  });

  const categoryId = watch('categoryId');

  useEffect(() => {
    if (categories[0] && !categoryId && !isEditing) {
      setValue('categoryId', categories[0].id, { shouldValidate: true });
    }
  }, [categories, categoryId, isEditing, setValue]);

  const categoryMap = useMemo(
    () => new Map(categories.map((c: Category) => [c.id, c.name])),
    [categories],
  );

  const clearImageState = useCallback(() => {
    setProductImage(null);
    setProductImagePreview((current) => {
      if (current?.startsWith('blob:')) URL.revokeObjectURL(current);
      return null;
    });
  }, []);

  const resetCreateForm = useCallback(() => {
    setEditingProductId(null);
    reset({
      name: '',
      price: '',
      categoryId: categories[0]?.id ?? '',
      description: '',
    });
    clearImageState();
  }, [categories, clearImageState, reset]);

  const startEdit = useCallback(
    (product: AdminProduct) => {
      setEditingProductId(product.id);
      reset(
        {
          name: product.name,
          price: String(product.price),
          categoryId: product.categoryId,
          description: product.description ?? '',
        },
        { shouldValidate: true },
      );
      setProductImage(null);
      setProductImagePreview(product.imageUrl);
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    [reset],
  );

  function handleImageChange(file: File | null) {
    setProductImage(file);
    if (productImagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(productImagePreview);
    }
    setProductImagePreview(file ? URL.createObjectURL(file) : null);
  }

  function onSubmit(data: ProductFormValues) {
    if (editingProductId) {
      updateProduct.mutate(
        { id: editingProductId, data, image: productImage },
        { onSuccess: () => resetCreateForm() },
      );
      return;
    }

    createProduct.mutate(
      { data, image: productImage },
      {
        onSuccess: () => {
          reset({
            name: '',
            price: '',
            categoryId: data.categoryId,
            description: '',
          });
          clearImageState();
        },
      },
    );
  }

  const saveError = createProduct.isError || updateProduct.isError;

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
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Produtos</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Adicione itens ao cardápio com foto, preço e descrição.
        </p>
      </div>

      <div ref={formRef}>
        <Card>
        {isEditing && (
          <p className="mb-4 text-sm font-medium text-brand-700 dark:text-brand-400">
            Editando produto — altere os campos abaixo e salve.
          </p>
        )}
        <form method="post" onSubmit={handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
          <div>
            <Input placeholder="Nome do produto" {...register('name', productNameRules)} />
            <FieldError message={errors.name?.message} />
          </div>
          <div>
            <Input
              placeholder="Preço"
              type="number"
              step="0.01"
              min="0"
              {...register('price', priceRules)}
            />
            <FieldError message={errors.price?.message} />
          </div>
          <div>
            <Select {...register('categoryId', categoryIdRules)} disabled={categories.length === 0}>
              {categories.length === 0 ? (
                <option value="">Cadastre uma categoria primeiro</option>
              ) : (
                categories.map((c: Category) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))
              )}
            </Select>
            <FieldError message={errors.categoryId?.message} />
          </div>
          <Input placeholder="Descrição (opcional)" {...register('description')} />
          <div className="md:col-span-2">
            <ImageUpload
              value={productImage}
              previewUrl={productImagePreview}
              disabled={isSaving}
              onChange={handleImageChange}
            />
          </div>
          {saveError && (
            <p className="md:col-span-2 text-sm text-red-600 dark:text-red-400">
              Não foi possível salvar o produto. Verifique os campos e tente novamente.
            </p>
          )}
          <div className="flex flex-wrap gap-2 md:col-span-2">
            <Button type="submit" disabled={!isValid || categories.length === 0 || isSaving}>
              {isEditing ? (
                isSaving ? (
                  'Salvando...'
                ) : (
                  'Salvar alterações'
                )
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  {isSaving ? 'Salvando...' : 'Adicionar produto'}
                </>
              )}
            </Button>
            {isEditing && (
              <Button type="button" variant="outline" disabled={isSaving} onClick={resetCreateForm}>
                Cancelar
              </Button>
            )}
          </div>
        </form>
        </Card>
      </div>

      {products.length === 0 ? (
        <EmptyState
          icon={<Package className="h-5 w-5" />}
          title="Nenhum produto"
          description="Adicione produtos para montar o cardápio digital."
        />
      ) : (
        <ul className="divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {products.map((p: AdminProduct) => (
            <ProductRow
              key={p.id}
              product={p}
              categoryName={categoryMap.get(p.categoryId) ?? '—'}
              isEditing={editingProductId === p.id}
              onEdit={startEdit}
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
