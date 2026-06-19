import { memo, useCallback, useMemo, useState } from 'react';
import { ArrowLeft, UtensilsCrossed, X } from 'lucide-react';
import type { OrderItemSelectionDto, ProductDto, ProductOptionGroupDto } from '@pedidonamesa/shared';
import { validateProductSelections } from '@pedidonamesa/shared';
import { formatCurrency } from '../../lib/utils';
import { cn } from '../../lib/cn';
import { Badge } from '../ui/Badge';

interface ProductConfigureSheetProps {
  product: ProductDto | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (payload: {
    product: ProductDto;
    unitPrice: number;
    selections: OrderItemSelectionDto[];
  }) => void;
}

function OptionGroupSection({
  group,
  selectedIds,
  onToggle,
}: {
  group: ProductOptionGroupDto;
  selectedIds: string[];
  onToggle: (optionId: string) => void;
}) {
  const isSingle = group.maxSelections === 1;
  const countLabel = `${selectedIds.length} / ${group.maxSelections}`;

  return (
    <section className="overflow-hidden rounded-xl bg-zinc-900 ring-1 ring-zinc-800">
      <div className="flex items-center justify-between gap-3 bg-zinc-800/80 px-4 py-3">
        <div>
          <h3 className="font-semibold text-white">{group.name}</h3>
          <p className="text-xs text-zinc-400">
            {isSingle ? 'Escolha 1 opção' : `Escolha até ${group.maxSelections} opções`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!isSingle && (
            <span className="rounded-full bg-sky-500/15 px-2.5 py-0.5 text-xs font-semibold text-sky-400">
              {countLabel}
            </span>
          )}
          <Badge variant={group.required ? 'info' : 'muted'}>
            {group.required ? 'Obrigatório' : 'Opcional'}
          </Badge>
        </div>
      </div>

      <ul>
        {group.options.map((option, index) => {
          const checked = selectedIds.includes(option.id);
          return (
            <li
              key={option.id}
              className={cn(
                'border-t border-zinc-800',
                index === 0 && 'border-t-0',
              )}
            >
              <button
                type="button"
                onClick={() => onToggle(option.id)}
                className="flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-zinc-800/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-white">{option.name}</p>
                  {option.priceDelta > 0 && (
                    <p className="mt-0.5 text-sm text-zinc-400">
                      + {formatCurrency(option.priceDelta)}
                    </p>
                  )}
                </div>
                <span
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition',
                    checked
                      ? 'border-brand-500 bg-brand-500'
                      : 'border-zinc-500 bg-transparent',
                  )}
                  aria-hidden
                >
                  {checked && <span className="h-2.5 w-2.5 rounded-full bg-white" />}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export const ProductConfigureSheet = memo(function ProductConfigureSheet({
  product,
  open,
  onClose,
  onConfirm,
}: ProductConfigureSheetProps) {
  const [selectedByGroup, setSelectedByGroup] = useState<Record<string, string[]>>({});
  const [error, setError] = useState('');

  const resetState = useCallback(() => {
    setSelectedByGroup({});
    setError('');
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [onClose, resetState]);

  const toggleOption = useCallback(
    (group: ProductOptionGroupDto, optionId: string) => {
      setError('');
      setSelectedByGroup((current) => {
        const currentGroup = current[group.id] ?? [];

        if (group.maxSelections === 1) {
          return { ...current, [group.id]: [optionId] };
        }

        if (currentGroup.includes(optionId)) {
          return {
            ...current,
            [group.id]: currentGroup.filter((id) => id !== optionId),
          };
        }

        if (currentGroup.length >= group.maxSelections) {
          return current;
        }

        return { ...current, [group.id]: [...currentGroup, optionId] };
      });
    },
    [],
  );

  const selectionInputs = useMemo(
    () =>
      Object.entries(selectedByGroup).flatMap(([groupId, optionIds]) =>
        optionIds.map((optionId) => ({ groupId, optionId })),
      ),
    [selectedByGroup],
  );

  const validation = useMemo(() => {
    if (!product) return null;
    return validateProductSelections(product, selectionInputs);
  }, [product, selectionInputs]);

  const unitPrice = validation && validation.ok ? validation.unitPrice : product?.price ?? 0;

  const handleConfirm = useCallback(() => {
    if (!product || !validation) return;
    if (!validation.ok) {
      setError(validation.message);
      return;
    }
    onConfirm({ product, unitPrice: validation.unitPrice, selections: validation.selections });
    resetState();
  }, [onConfirm, product, resetState, validation]);

  if (!open || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950">
      <div className="relative h-52 shrink-0 overflow-hidden bg-zinc-900 sm:h-64">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-950">
            <UtensilsCrossed className="h-16 w-16 text-zinc-700" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
        <button
          type="button"
          onClick={handleClose}
          className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 hidden h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70 sm:flex"
          aria-label="Fechar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-28 pt-5">
        <h2 className="text-xl font-bold text-white">{product.name}</h2>
        {product.description && (
          <p className="mt-1 text-sm text-zinc-400">{product.description}</p>
        )}

        <div className="mt-6 space-y-4">
          {(product.optionGroups ?? []).map((group) => (
            <OptionGroupSection
              key={group.id}
              group={group}
              selectedIds={selectedByGroup[group.id] ?? []}
              onToggle={(optionId) => toggleOption(group, optionId)}
            />
          ))}
        </div>

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-zinc-800 bg-zinc-950/95 p-4 backdrop-blur-md">
        <button
          type="button"
          onClick={handleConfirm}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-4 text-base font-bold text-white transition hover:bg-emerald-600 active:scale-[0.99]"
        >
          Adicionar · {formatCurrency(unitPrice)}
        </button>
      </div>
    </div>
  );
});
