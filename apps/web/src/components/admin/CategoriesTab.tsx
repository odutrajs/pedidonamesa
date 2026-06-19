import { memo } from 'react';
import { useForm } from 'react-hook-form';
import type { Category, CategoryFormValues } from '../../types/admin';
import { useCategories, useCreateCategory } from '../../hooks/useAdmin';

export const CategoriesTab = memo(function CategoriesTab() {
  const { data: categories = [], isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const { register, handleSubmit, reset } = useForm<CategoryFormValues>({
    defaultValues: { name: '' },
  });

  function onSubmit(data: CategoryFormValues) {
    if (!data.name.trim()) return;
    createCategory.mutate(data, {
      onSuccess: () => reset(),
    });
  }

  if (isLoading) {
    return <p className="text-stone-500">Carregando categorias...</p>;
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit(onSubmit)} className="card flex flex-wrap gap-3 p-4">
        <input
          className="input max-w-xs"
          placeholder="Nome da categoria"
          {...register('name')}
        />
        <button className="btn-primary" disabled={createCategory.isPending}>
          {createCategory.isPending ? 'Salvando...' : 'Adicionar categoria'}
        </button>
      </form>
      <ul className="space-y-2">
        {categories.map((c: Category) => (
          <li key={c.id} className="card flex items-center justify-between p-4">
            <div>
              <p className="font-semibold">{c.name}</p>
              {c.description && <p className="text-sm text-stone-500">{c.description}</p>}
            </div>
            <span className="text-xs text-stone-500">{c.active ? 'Ativa' : 'Inativa'}</span>
          </li>
        ))}
      </ul>
    </div>
  );
});
