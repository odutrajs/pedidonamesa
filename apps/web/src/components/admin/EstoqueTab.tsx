import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ClipboardList,
  Package,
  Plus,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import {
  INGREDIENT_UNIT_LABELS,
  IngredientUnit,
  STOCK_MOVEMENT_TYPE_LABELS,
} from '@pedidonamesa/shared';
import { useProducts } from '../../hooks/useAdmin';
import {
  useCmvReport,
  useCreateIngredient,
  useDeleteIngredient,
  useIngredients,
  useProductRecipe,
  useRecordPurchase,
  useStockAlerts,
  useStockMovements,
  useSubmitInventoryCount,
  useUpdateIngredient,
  useUpdateProductRecipe,
} from '../../hooks/useInventory';
import { formatCurrency } from '../../lib/utils';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input, Label, Select } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/cn';

type TabId = 'overview' | 'ingredients' | 'recipes' | 'movements' | 'count';

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'overview', label: 'CMV & alertas' },
  { id: 'ingredients', label: 'Ingredientes' },
  { id: 'recipes', label: 'Fichas técnicas' },
  { id: 'movements', label: 'Movimentações' },
  { id: 'count', label: 'Contagem física' },
];

export function EstoqueTab() {
  const [tab, setTab] = useState<TabId>('overview');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Estoque</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Ficha técnica, baixa automática na cozinha, CMV teórico vs real e alertas de estoque mínimo.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => setTab(entry.id)}
            className={cn(
              'rounded-lg px-3 py-2 text-sm font-medium transition',
              tab === entry.id
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300',
            )}
          >
            {entry.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewSection />}
      {tab === 'ingredients' && <IngredientsSection />}
      {tab === 'recipes' && <RecipesSection />}
      {tab === 'movements' && <MovementsSection />}
      {tab === 'count' && <CountSection />}
    </div>
  );
}

function OverviewSection() {
  const { data: report, isLoading } = useCmvReport();
  const { data: alerts = [] } = useStockAlerts();

  if (isLoading || !report) {
    return <p className="text-sm text-zinc-500">Carregando relatório...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Receita no período" value={formatCurrency(report.revenue)} />
        <MetricCard label="CMV teórico" value={formatCurrency(report.theoreticalCmv)} />
        <MetricCard
          label="Margem teórica"
          value={`${report.theoreticalMarginPercent.toFixed(1)}%`}
          hint={formatCurrency(report.theoreticalMargin)}
        />
        <MetricCard
          label="CMV real"
          value={report.realCmv !== null ? formatCurrency(report.realCmv) : '—'}
          hint={
            report.hasInventoryCount
              ? report.variance !== null
                ? `Variação: ${formatCurrency(report.variance)}`
                : undefined
              : 'Faça contagem física'
          }
        />
      </div>

      {alerts.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 dark:text-amber-200">
                {alerts.length} ingrediente(s) abaixo do mínimo
              </h3>
              <ul className="mt-2 space-y-1 text-sm text-amber-800 dark:text-amber-300">
                {alerts.map((item) => (
                  <li key={item.id}>
                    {item.name}: {item.currentStock} {INGREDIENT_UNIT_LABELS[item.unit]} (mín.{' '}
                    {item.minStock})
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-5">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Top produtos (margem teórica)</h3>
        {report.topProducts.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">Nenhuma venda com ficha técnica no período.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-700">
                  <th className="pb-2 pr-4">Produto</th>
                  <th className="pb-2 pr-4">Qtd</th>
                  <th className="pb-2 pr-4">Receita</th>
                  <th className="pb-2 pr-4">Custo teórico</th>
                  <th className="pb-2">Margem</th>
                </tr>
              </thead>
              <tbody>
                {report.topProducts.map((product) => (
                  <tr key={product.productId} className="border-b border-zinc-100 dark:border-zinc-800">
                    <td className="py-2 pr-4 font-medium">{product.productName}</td>
                    <td className="py-2 pr-4">{product.quantitySold}</td>
                    <td className="py-2 pr-4">{formatCurrency(product.revenue)}</td>
                    <td className="py-2 pr-4">{formatCurrency(product.theoreticalCost)}</td>
                    <td className="py-2">{product.marginPercent.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function IngredientsSection() {
  const { data: ingredients = [], isLoading } = useIngredients();
  const createIngredient = useCreateIngredient();
  const updateIngredient = useUpdateIngredient();
  const deleteIngredient = useDeleteIngredient();
  const recordPurchase = useRecordPurchase();

  const [name, setName] = useState('');
  const [unit, setUnit] = useState<IngredientUnit>(IngredientUnit.G);
  const [costPerUnit, setCostPerUnit] = useState('');
  const [minStock, setMinStock] = useState('');
  const [currentStock, setCurrentStock] = useState('');

  return (
    <div className="space-y-4">
      <Card className="space-y-4 p-5">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Novo ingrediente</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Blend bovino" />
          </div>
          <div>
            <Label>Unidade</Label>
            <Select value={unit} onChange={(e) => setUnit(e.target.value as IngredientUnit)}>
              {Object.values(IngredientUnit).map((value) => (
                <option key={value} value={value}>
                  {INGREDIENT_UNIT_LABELS[value]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Custo unitário (R$)</Label>
            <Input value={costPerUnit} onChange={(e) => setCostPerUnit(e.target.value)} placeholder="0,05" />
          </div>
          <div>
            <Label>Estoque inicial</Label>
            <Input value={currentStock} onChange={(e) => setCurrentStock(e.target.value)} placeholder="5000" />
          </div>
          <div>
            <Label>Estoque mínimo</Label>
            <Input value={minStock} onChange={(e) => setMinStock(e.target.value)} placeholder="1000" />
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          disabled={!name.trim() || createIngredient.isPending}
          onClick={() =>
            createIngredient.mutate(
              {
                name: name.trim(),
                unit,
                costPerUnit: Number(costPerUnit.replace(',', '.')) || 0,
                currentStock: Number(currentStock.replace(',', '.')) || 0,
                minStock: Number(minStock.replace(',', '.')) || 0,
              },
              {
                onSuccess: () => {
                  setName('');
                  setCostPerUnit('');
                  setCurrentStock('');
                  setMinStock('');
                },
              },
            )
          }
        >
          <Plus className="h-3.5 w-3.5" />
          Adicionar ingrediente
        </Button>
      </Card>

      <Card className="overflow-hidden">
        {isLoading ? (
          <p className="p-5 text-sm text-zinc-500">Carregando...</p>
        ) : ingredients.length === 0 ? (
          <p className="p-5 text-sm text-zinc-500">Cadastre insumos para começar.</p>
        ) : (
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {ingredients.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-zinc-900 dark:text-zinc-50">{item.name}</p>
                    {item.isLowStock && <Badge variant="warning">Estoque baixo</Badge>}
                    {!item.active && <Badge variant="muted">Inativo</Badge>}
                  </div>
                  <p className="text-sm text-zinc-500">
                    {item.currentStock} {INGREDIENT_UNIT_LABELS[item.unit]} · custo{' '}
                    {formatCurrency(item.costPerUnit)}/{INGREDIENT_UNIT_LABELS[item.unit]} · valor em estoque{' '}
                    {formatCurrency(item.stockValue)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      recordPurchase.mutate({
                        ingredientId: item.id,
                        quantity: 100,
                        notes: 'Entrada rápida +100',
                      })
                    }
                  >
                    +100 entrada
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      updateIngredient.mutate({
                        id: item.id,
                        data: { minStock: Number(item.minStock) + 100 },
                      })
                    }
                  >
                    Ajustar mínimo
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => deleteIngredient.mutate(item.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function RecipesSection() {
  const { data: products = [] } = useProducts();
  const { data: ingredients = [] } = useIngredients();
  const [productId, setProductId] = useState('');
  const { data: recipe, isLoading } = useProductRecipe(productId || null);
  const updateRecipe = useUpdateProductRecipe();
  const [lines, setLines] = useState<Array<{ ingredientId: string; quantity: string }>>([]);

  const selectedProductId = productId || products[0]?.id || '';

  useEffect(() => {
    if (recipe) {
      setLines(
        recipe.ingredients.map((line) => ({
          ingredientId: line.ingredientId,
          quantity: String(line.quantity),
        })),
      );
    }
  }, [recipe]);

  return (
    <div className="space-y-4">
      <Card className="space-y-4 p-5">
        <div>
          <Label>Produto</Label>
          <Select value={selectedProductId} onChange={(e) => setProductId(e.target.value)}>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </Select>
        </div>

        {isLoading || !recipe ? (
          <p className="text-sm text-zinc-500">Carregando ficha técnica...</p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <MetricCard label="Preço de venda" value={formatCurrency(recipe.productPrice)} />
              <MetricCard label="Custo da ficha" value={formatCurrency(recipe.totalCost)} />
              <MetricCard label="Margem teórica" value={`${recipe.marginPercent.toFixed(1)}%`} />
            </div>

            <div className="space-y-3">
              {lines.map((line, index) => (
                <div key={index} className="grid gap-2 sm:grid-cols-[1fr_120px_40px]">
                  <Select
                    value={line.ingredientId}
                    onChange={(e) => {
                      const next = [...lines];
                      next[index] = { ...next[index], ingredientId: e.target.value };
                      setLines(next);
                    }}
                  >
                    <option value="">Ingrediente</option>
                    {ingredients.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </Select>
                  <Input
                    value={line.quantity}
                    onChange={(e) => {
                      const next = [...lines];
                      next[index] = { ...next[index], quantity: e.target.value };
                      setLines(next);
                    }}
                    placeholder="Qtd"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setLines(lines.filter((_, i) => i !== index))}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setLines([...lines, { ingredientId: '', quantity: '' }])}
              >
                <Plus className="h-3.5 w-3.5" />
                Linha
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={updateRecipe.isPending}
                onClick={() =>
                  updateRecipe.mutate({
                    productId: recipe.productId,
                    lines: lines
                      .filter((line) => line.ingredientId && Number(line.quantity) > 0)
                      .map((line) => ({
                        ingredientId: line.ingredientId,
                        quantity: Number(line.quantity.replace(',', '.')),
                      })),
                  })
                }
              >
                Salvar ficha técnica
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

function MovementsSection() {
  const { data: movements = [], isLoading } = useStockMovements();

  return (
    <Card className="overflow-hidden">
      {isLoading ? (
        <p className="p-5 text-sm text-zinc-500">Carregando...</p>
      ) : movements.length === 0 ? (
        <p className="p-5 text-sm text-zinc-500">Nenhuma movimentação ainda.</p>
      ) : (
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {movements.map((movement) => (
            <li key={movement.id} className="px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">{movement.ingredientName}</p>
                  <p className="text-sm text-zinc-500">
                    {STOCK_MOVEMENT_TYPE_LABELS[movement.type]} · {movement.quantity}{' '}
                    {formatCurrency(movement.totalCost)}
                  </p>
                </div>
                <p className="text-xs text-zinc-400">
                  Saldo: {movement.balanceAfter} · {new Date(movement.createdAt).toLocaleString('pt-BR')}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function CountSection() {
  const { data: ingredients = [] } = useIngredients();
  const submitCount = useSubmitInventoryCount();
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');

  return (
    <Card className="space-y-4 p-5">
      <p className="text-sm text-zinc-500">
        Informe a quantidade física contada. O sistema ajusta o estoque e alimenta o CMV real do período.
      </p>
      <div className="space-y-3">
        {ingredients.map((item) => (
          <div key={item.id} className="grid gap-2 sm:grid-cols-[1fr_140px_140px]">
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-xs text-zinc-500">
                Sistema: {item.currentStock} {INGREDIENT_UNIT_LABELS[item.unit]}
              </p>
            </div>
            <Input
              placeholder="Qtd física"
              value={quantities[item.id] ?? ''}
              onChange={(e) => setQuantities({ ...quantities, [item.id]: e.target.value })}
            />
          </div>
        ))}
      </div>
      <div>
        <Label>Observações</Label>
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <Button
        type="button"
        disabled={submitCount.isPending}
        onClick={() =>
          submitCount.mutate({
            notes: notes.trim() || undefined,
            lines: ingredients
              .filter((item) => quantities[item.id]?.trim())
              .map((item) => ({
                ingredientId: item.id,
                physicalQuantity: Number(quantities[item.id].replace(',', '.')),
              })),
          })
        }
      >
        <ClipboardList className="h-3.5 w-3.5" />
        Registrar contagem física
      </Button>
    </Card>
  );
}

function MetricCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-2">
        <TrendingUp className="mt-0.5 h-4 w-4 text-brand-600" />
        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
          <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">{value}</p>
          {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
        </div>
      </div>
    </Card>
  );
}
