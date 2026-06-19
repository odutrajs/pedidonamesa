import { Sparkles } from 'lucide-react';
import { useCategories } from '../../hooks/useAdmin';
import { useRestaurantSettings, useUpdateRestaurantSettings } from '../../hooks/useSettings';
import { Card } from '../ui/Card';
import { Label, Select } from '../ui/Input';

function CategorySelect({
  label,
  value,
  disabled,
  categories,
  onChange,
}: {
  label: string;
  value: string | null;
  disabled?: boolean;
  categories: { id: string; name: string }[];
  onChange: (categoryId: string | null) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Select
        value={value ?? ''}
        disabled={disabled || categories.length === 0}
        onChange={(event) => onChange(event.target.value || null)}
      >
        <option value="">Selecione uma categoria</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </Select>
    </div>
  );
}

export function CarrinhoTab() {
  const { data: settings, isLoading } = useRestaurantSettings();
  const { data: categories = [] } = useCategories();
  const updateSettings = useUpdateRestaurantSettings();

  if (isLoading || !settings) {
    return <p className="text-sm text-zinc-500">Carregando configurações...</p>;
  }

  const defaultCategoryId = categories[0]?.id ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Carrinho</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Configure sugestões automáticas enquanto o cliente monta o pedido.
        </p>
      </div>

      <Card className="p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-brand-100 p-2 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">Sugestões no carrinho</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Exiba até 3 itens extras no carrinho para aumentar o ticket médio.
            </p>
          </div>
        </div>

        <div className="mt-5">
          <CategorySelect
            label="Categoria de bebidas"
            value={settings.upsellDrinkCategoryId}
            disabled={updateSettings.isPending}
            categories={categories}
            onChange={(upsellDrinkCategoryId) => updateSettings.mutate({ upsellDrinkCategoryId })}
          />
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
            Usada para identificar quando o carrinho tem apenas comida ou apenas bebidas.
          </p>
        </div>

        <div className="mt-6 space-y-4">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
            <input
              type="checkbox"
              className="mt-1"
              checked={settings.upsellFoodOnlyEnabled}
              disabled={updateSettings.isPending}
              onChange={(event) =>
                updateSettings.mutate({
                  upsellFoodOnlyEnabled: event.target.checked,
                  upsellFoodOnlyCategoryId: event.target.checked
                    ? settings.upsellFoodOnlyCategoryId ?? defaultCategoryId
                    : settings.upsellFoodOnlyCategoryId,
                })
              }
            />
            <div className="flex-1">
              <p className="font-medium text-zinc-900 dark:text-zinc-50">Somente comida</p>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Sugere itens quando o carrinho tiver comida, mas nenhuma bebida.
              </p>
              {settings.upsellFoodOnlyEnabled && (
                <div className="mt-4">
                  <CategorySelect
                    label="Categoria para sugerir"
                    value={settings.upsellFoodOnlyCategoryId}
                    disabled={updateSettings.isPending}
                    categories={categories}
                    onChange={(upsellFoodOnlyCategoryId) =>
                      updateSettings.mutate({ upsellFoodOnlyCategoryId })
                    }
                  />
                </div>
              )}
            </div>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
            <input
              type="checkbox"
              className="mt-1"
              checked={settings.upsellDrinksOnlyEnabled}
              disabled={updateSettings.isPending}
              onChange={(event) =>
                updateSettings.mutate({
                  upsellDrinksOnlyEnabled: event.target.checked,
                  upsellDrinksOnlyCategoryId: event.target.checked
                    ? settings.upsellDrinksOnlyCategoryId ?? defaultCategoryId
                    : settings.upsellDrinksOnlyCategoryId,
                })
              }
            />
            <div className="flex-1">
              <p className="font-medium text-zinc-900 dark:text-zinc-50">Somente bebidas</p>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Sugere itens quando o carrinho tiver apenas bebidas.
              </p>
              {settings.upsellDrinksOnlyEnabled && (
                <div className="mt-4">
                  <CategorySelect
                    label="Categoria para sugerir"
                    value={settings.upsellDrinksOnlyCategoryId}
                    disabled={updateSettings.isPending}
                    categories={categories}
                    onChange={(upsellDrinksOnlyCategoryId) =>
                      updateSettings.mutate({ upsellDrinksOnlyCategoryId })
                    }
                  />
                </div>
              )}
            </div>
          </label>
        </div>

        {updateSettings.isSuccess && (
          <p className="mt-4 text-sm text-green-600 dark:text-green-400">
            Configuração salva com sucesso.
          </p>
        )}

        <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-500">
          Você também pode definir sugestões manuais por produto em Cardápio → Produtos.
        </p>
      </Card>
    </div>
  );
}
