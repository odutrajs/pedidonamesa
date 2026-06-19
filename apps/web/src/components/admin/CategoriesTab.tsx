import { memo } from 'react';
import { useForm } from 'react-hook-form';
import { FolderOpen, Plus } from 'lucide-react';
import type { Category, CategoryFormValues } from '../../types/admin';
import { useCategories, useCreateCategory } from '../../hooks/useAdmin';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';

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
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">Categorias</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Organize seu cardápio em seções como Entradas, Pratos e Bebidas.
        </p>
      </div>

      <Card className="flex flex-wrap items-end gap-3">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1">
            <Input placeholder="Nome da categoria" {...register('name')} />
          </div>
          <Button type="submit" disabled={createCategory.isPending}>
            <Plus className="h-4 w-4" />
            {createCategory.isPending ? 'Salvando...' : 'Adicionar'}
          </Button>
        </form>
      </Card>

      {categories.length === 0 ? (
        <EmptyState
          icon={<FolderOpen className="h-5 w-5" />}
          title="Nenhuma categoria"
          description="Crie a primeira categoria para começar a montar seu cardápio."
        />
      ) : (
        <ul className="divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 bg-white">
          {categories.map((c: Category) => (
            <li key={c.id} className="flex items-center justify-between gap-4 px-4 py-4">
              <div>
                <p className="font-medium text-zinc-900">{c.name}</p>
                {c.description && (
                  <p className="mt-0.5 text-sm text-zinc-500">{c.description}</p>
                )}
              </div>
              <Badge variant={c.active ? 'success' : 'muted'}>
                {c.active ? 'Ativa' : 'Inativa'}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});
