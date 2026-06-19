import { memo, useCallback, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FolderOpen, GripVertical, Pencil, Plus } from 'lucide-react';
import type { Category, CategoryFormValues } from '../../types/admin';
import {
  useCategories,
  useCreateCategory,
  useReorderCategories,
  useUpdateCategory,
} from '../../hooks/useAdmin';
import { categoryNameRules, formConfig } from '../../lib/validation';
import { cn } from '../../lib/cn';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { FieldError, Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';

const SortableCategoryRow = memo(function SortableCategoryRow({
  category,
  index,
  isEditing,
  dragDisabled,
  onEdit,
}: {
  category: Category;
  index: number;
  isEditing: boolean;
  dragDisabled: boolean;
  onEdit: (category: Category) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
    disabled: dragDisabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 px-4 py-4',
        isEditing && 'bg-brand-50/60 dark:bg-brand-950/40',
        isDragging && 'relative z-10 bg-white shadow-md dark:bg-zinc-900',
      )}
    >
      <button
        type="button"
        className={cn(
          'flex shrink-0 touch-none flex-col items-center gap-1 rounded-lg p-1 text-zinc-400 transition',
          dragDisabled
            ? 'cursor-not-allowed opacity-40'
            : 'cursor-grab active:cursor-grabbing hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300',
        )}
        disabled={dragDisabled}
        aria-label={`Arrastar ${category.name}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
        <span className="text-xs font-medium tabular-nums">{index + 1}</span>
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-zinc-900 dark:text-zinc-50">{category.name}</p>
          <Badge variant={category.active ? 'success' : 'muted'}>
            {category.active ? 'Ativa' : 'Inativa'}
          </Badge>
          {isEditing && <Badge variant="muted">Editando</Badge>}
        </div>
        {category.description && (
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{category.description}</p>
        )}
      </div>

      <Button
        variant="outline"
        size="sm"
        disabled={isEditing || dragDisabled}
        onClick={() => onEdit(category)}
      >
        <Pencil className="h-3.5 w-3.5" />
        Editar
      </Button>
    </li>
  );
});

export const CategoriesTab = memo(function CategoriesTab() {
  const formRef = useRef<HTMLDivElement>(null);
  const { data: categories = [], isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const reorderCategories = useReorderCategories();

  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [active, setActive] = useState(true);

  const isEditing = editingCategoryId !== null;
  const isSaving = createCategory.isPending || updateCategory.isPending;
  const dragDisabled = isEditing || reorderCategories.isPending;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<CategoryFormValues>({
    ...formConfig,
    defaultValues: { name: '', description: '' },
  });

  const resetCreateForm = useCallback(() => {
    setEditingCategoryId(null);
    setActive(true);
    reset({ name: '', description: '' });
  }, [reset]);

  const startEdit = useCallback(
    (category: Category) => {
      setEditingCategoryId(category.id);
      setActive(category.active);
      reset(
        {
          name: category.name,
          description: category.description ?? '',
        },
        { shouldValidate: true },
      );
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    [reset],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = categories.findIndex((category) => category.id === active.id);
      const newIndex = categories.findIndex((category) => category.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const orderedIds = arrayMove(
        categories.map((category) => category.id),
        oldIndex,
        newIndex,
      );

      reorderCategories.mutate(orderedIds);
    },
    [categories, reorderCategories],
  );

  function onSubmit(data: CategoryFormValues) {
    if (editingCategoryId) {
      updateCategory.mutate(
        { id: editingCategoryId, data: { ...data, active } },
        { onSuccess: () => resetCreateForm() },
      );
      return;
    }

    createCategory.mutate(data, {
      onSuccess: () => reset({ name: '', description: '' }),
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
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Categorias</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Organize seu cardápio em seções como Entradas, Pratos e Bebidas. Arraste pelo ícone ⋮⋮
          para definir a ordem exibida no cardápio digital.
        </p>
      </div>

      <div ref={formRef}>
        <Card>
          {isEditing && (
            <p className="mb-4 text-sm font-medium text-brand-700 dark:text-brand-400">
              Editando categoria — altere os campos abaixo e salve.
            </p>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Input placeholder="Nome da categoria" {...register('name', categoryNameRules)} />
              <FieldError message={errors.name?.message} />
            </div>
            <div>
              <Input
                placeholder="Descrição (opcional)"
                {...register('description')}
              />
            </div>
            {isEditing && (
              <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-brand-600 focus:ring-brand-500"
                />
                Categoria ativa no cardápio
              </label>
            )}
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={!isValid || isSaving}>
                {isEditing ? (
                  isSaving ? (
                    'Salvando...'
                  ) : (
                    'Salvar alterações'
                  )
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    {isSaving ? 'Salvando...' : 'Adicionar'}
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

      {categories.length === 0 ? (
        <EmptyState
          icon={<FolderOpen className="h-5 w-5" />}
          title="Nenhuma categoria"
          description="Crie a primeira categoria para começar a montar seu cardápio."
        />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={categories.map((category) => category.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
              {categories.map((category, index) => (
                <SortableCategoryRow
                  key={category.id}
                  category={category}
                  index={index}
                  isEditing={editingCategoryId === category.id}
                  dragDisabled={dragDisabled}
                  onEdit={startEdit}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
});
