import type {
  CreateOrderItemSelectionInput,
  OrderItemSelectionDto,
  ProductDto,
} from './index.js';

export type SelectedOptionInput = CreateOrderItemSelectionInput;

export function isProductConfigurable(product: ProductDto): boolean {
  return (product.optionGroups?.length ?? 0) > 0;
}

export function getMinimumUnitPrice(product: ProductDto): number {
  if (!isProductConfigurable(product)) return product.price;

  let minDelta = 0;
  for (const group of product.optionGroups ?? []) {
    if (group.required && group.options.length > 0) {
      const cheapest = Math.min(...group.options.map((option) => option.priceDelta));
      minDelta += cheapest * Math.max(1, group.minSelections);
    }
  }
  return product.price + minDelta;
}

export function buildCartLineId(productId: string, selections: OrderItemSelectionDto[]): string {
  if (selections.length === 0) return productId;
  const key = selections
    .map((selection) => `${selection.groupId}:${selection.optionId}`)
    .sort()
    .join('|');
  return `${productId}::${key}`;
}

export function validateProductSelections(
  product: ProductDto,
  inputs: SelectedOptionInput[],
): { ok: true; selections: OrderItemSelectionDto[]; unitPrice: number } | { ok: false; message: string } {
  const groups = product.optionGroups ?? [];
  if (groups.length === 0) {
    return {
      ok: true,
      selections: [],
      unitPrice: product.price,
    };
  }

  const byGroup = new Map<string, SelectedOptionInput[]>();
  for (const input of inputs) {
    const list = byGroup.get(input.groupId) ?? [];
    list.push(input);
    byGroup.set(input.groupId, list);
  }

  const selections: OrderItemSelectionDto[] = [];
  let unitPrice = product.price;

  for (const group of groups) {
    const chosen = byGroup.get(group.id) ?? [];

    if (group.required && chosen.length < group.minSelections) {
      return { ok: false, message: `Selecione ${group.name.toLowerCase()}` };
    }

    if (chosen.length > group.maxSelections) {
      return { ok: false, message: `Máximo ${group.maxSelections} opção(ões) em ${group.name}` };
    }

    if (chosen.length > 0 && chosen.length < group.minSelections) {
      return {
        ok: false,
        message: `Escolha ${group.minSelections} opção(ões) em ${group.name}`,
      };
    }

    const seen = new Set<string>();
    for (const input of chosen) {
      if (seen.has(input.optionId)) {
        return { ok: false, message: `Opção duplicada em ${group.name}` };
      }
      seen.add(input.optionId);

      const option = group.options.find((entry) => entry.id === input.optionId);
      if (!option) {
        return { ok: false, message: `Opção inválida em ${group.name}` };
      }

      selections.push({
        groupId: group.id,
        groupName: group.name,
        optionId: option.id,
        optionName: option.name,
        priceDelta: option.priceDelta,
      });
      unitPrice += option.priceDelta;
    }
  }

  return { ok: true, selections, unitPrice };
}

export function formatSelectionSummary(selections: OrderItemSelectionDto[]): string[] {
  return selections.map((selection) => selection.optionName);
}
