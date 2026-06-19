import type {
  CategoryDto,
  ProductDto,
  UpsellConfigDto,
  UpsellSuggestionDto,
} from '@pedidonamesa/shared';
import type { CartLineItem } from '../types/cart';

const MAX_SUGGESTIONS = 3;

function buildProductMap(categories: CategoryDto[]): Map<string, ProductDto> {
  const map = new Map<string, ProductDto>();
  for (const category of categories) {
    for (const product of category.products) {
      map.set(product.id, product);
    }
  }
  return map;
}

export function getUpsellSuggestions(
  cart: CartLineItem[],
  categories: CategoryDto[],
  upsell: UpsellConfigDto,
): UpsellSuggestionDto[] {
  if (cart.length === 0) return [];

  const productMap = buildProductMap(categories);
  const cartProductIds = new Set(cart.map((item) => item.product.id));
  const results: UpsellSuggestionDto[] = [];
  const seen = new Set<string>();

  const pushSuggestion = (product: ProductDto, reason: UpsellSuggestionDto['reason']) => {
    if (seen.has(product.id) || cartProductIds.has(product.id) || !product.available) return;
    seen.add(product.id);
    results.push({ product, reason });
  };

  for (const item of cart) {
    for (const suggestedId of item.product.suggestedProductIds ?? []) {
      const product = productMap.get(suggestedId);
      if (product) pushSuggestion(product, 'product');
      if (results.length >= MAX_SUGGESTIONS) return results;
    }
  }

  const drinkCategoryId = upsell.drinkCategoryId;
  if (!drinkCategoryId || results.length >= MAX_SUGGESTIONS) return results;

  const hasDrink = cart.some((item) => item.product.categoryId === drinkCategoryId);
  const hasFood = cart.some((item) => item.product.categoryId !== drinkCategoryId);

  const suggestFromCategory = (
    categoryId: string | null | undefined,
    reason: UpsellSuggestionDto['reason'],
  ) => {
    if (!categoryId) return;
    const category = categories.find((entry) => entry.id === categoryId);
    for (const product of category?.products ?? []) {
      pushSuggestion(product, reason);
      if (results.length >= MAX_SUGGESTIONS) break;
    }
  };

  if (hasFood && !hasDrink && upsell.foodOnlyEnabled) {
    suggestFromCategory(upsell.foodOnlyCategoryId, 'food_only');
  } else if (hasDrink && !hasFood && upsell.drinksOnlyEnabled) {
    suggestFromCategory(upsell.drinksOnlyCategoryId, 'drinks_only');
  }

  return results;
}
