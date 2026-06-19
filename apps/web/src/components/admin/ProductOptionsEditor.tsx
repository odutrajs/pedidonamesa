import { memo } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { ProductOptionGroupDto } from '@pedidonamesa/shared';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

function newId() {
  return crypto.randomUUID();
}

function createEmptyGroup(): ProductOptionGroupDto {
  return {
    id: newId(),
    name: 'Nova opção',
    minSelections: 1,
    maxSelections: 1,
    required: true,
    options: [{ id: newId(), name: 'Opção 1', priceDelta: 0 }],
  };
}

interface ProductOptionsEditorProps {
  value: ProductOptionGroupDto[];
  onChange: (groups: ProductOptionGroupDto[]) => void;
  disabled?: boolean;
}

export const ProductOptionsEditor = memo(function ProductOptionsEditor({
  value,
  onChange,
  disabled = false,
}: ProductOptionsEditorProps) {
  const updateGroup = (groupId: string, patch: Partial<ProductOptionGroupDto>) => {
    onChange(value.map((group) => (group.id === groupId ? { ...group, ...patch } : group)));
  };

  const removeGroup = (groupId: string) => {
    onChange(value.filter((group) => group.id !== groupId));
  };

  const addOption = (groupId: string) => {
    onChange(
      value.map((group) =>
        group.id === groupId
          ? {
              ...group,
              options: [
                ...group.options,
                { id: newId(), name: `Opção ${group.options.length + 1}`, priceDelta: 0 },
              ],
            }
          : group,
      ),
    );
  };

  const updateOption = (
    groupId: string,
    optionId: string,
    patch: { name?: string; priceDelta?: number },
  ) => {
    onChange(
      value.map((group) =>
        group.id === groupId
          ? {
              ...group,
              options: group.options.map((option) =>
                option.id === optionId ? { ...option, ...patch } : option,
              ),
            }
          : group,
      ),
    );
  };

  const removeOption = (groupId: string, optionId: string) => {
    onChange(
      value.map((group) =>
        group.id === groupId
          ? { ...group, options: group.options.filter((option) => option.id !== optionId) }
          : group,
      ),
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            Opções do produto
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Configure bordas, massas, sabores e outros complementos.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => onChange([...value, createEmptyGroup()])}
        >
          <Plus className="h-4 w-4" />
          Grupo
        </Button>
      </div>

      {value.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 px-4 py-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          Produto simples — sem personalização. Adicione grupos para pizzas e combos.
        </p>
      ) : (
        value.map((group) => (
          <div
            key={group.id}
            className="space-y-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-700"
          >
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                placeholder="Nome do grupo (ex: Bordas)"
                value={group.name}
                disabled={disabled}
                onChange={(event) => updateGroup(group.id, { name: event.target.value })}
              />
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={group.required}
                    disabled={disabled}
                    onChange={(event) =>
                      updateGroup(group.id, { required: event.target.checked })
                    }
                  />
                  Obrigatório
                </label>
                <label className="flex items-center gap-2">
                  Mín
                  <input
                    type="number"
                    min={0}
                    className="w-14 rounded-md border border-zinc-300 px-2 py-1 dark:border-zinc-600 dark:bg-zinc-900"
                    value={group.minSelections}
                    disabled={disabled}
                    onChange={(event) =>
                      updateGroup(group.id, {
                        minSelections: Number(event.target.value) || 0,
                      })
                    }
                  />
                </label>
                <label className="flex items-center gap-2">
                  Máx
                  <input
                    type="number"
                    min={1}
                    className="w-14 rounded-md border border-zinc-300 px-2 py-1 dark:border-zinc-600 dark:bg-zinc-900"
                    value={group.maxSelections}
                    disabled={disabled}
                    onChange={(event) =>
                      updateGroup(group.id, {
                        maxSelections: Math.max(1, Number(event.target.value) || 1),
                      })
                    }
                  />
                </label>
              </div>
            </div>

            <div className="space-y-2">
              {group.options.map((option) => (
                <div key={option.id} className="flex items-center gap-2">
                  <Input
                    placeholder="Nome da opção"
                    value={option.name}
                    disabled={disabled}
                    onChange={(event) =>
                      updateOption(group.id, option.id, { name: event.target.value })
                    }
                  />
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="+ R$"
                    className="w-28"
                    value={option.priceDelta}
                    disabled={disabled}
                    onChange={(event) =>
                      updateOption(group.id, option.id, {
                        priceDelta: Number(event.target.value) || 0,
                      })
                    }
                  />
                  <button
                    type="button"
                    disabled={disabled || group.options.length <= 1}
                    onClick={() => removeOption(group.id, option.id)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-red-500 disabled:opacity-40 dark:hover:bg-zinc-800"
                    aria-label="Remover opção"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={() => addOption(group.id)}
              >
                <Plus className="h-4 w-4" />
                Opção
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={() => removeGroup(group.id)}
              >
                Remover grupo
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );
});
