import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import type {
  CreateDeliveryOrderInput,
  CreateOrderInput,
  MenuDto,
  OrderItemSelectionDto,
  ProductDto,
} from '@pedidonamesa/shared';
import {
  PaymentMode,
  buildCartLineId,
  isProductConfigurable,
} from '@pedidonamesa/shared';
import { MenuLayout } from '../components/menu/MenuLayout';
import { CategoryNav } from '../components/menu/CategoryNav';
import { CartSidebar, type DeliveryFormValues } from '../components/menu/CartSidebar';
import { CartDrawer } from '../components/menu/CartDrawer';
import { ProductCategorySection } from '../components/menu/ProductCategorySection';
import { ProductConfigureSheet } from '../components/menu/ProductConfigureSheet';
import { PaymentCheckoutModal } from '../components/payment/PaymentCheckoutModal';
import { Skeleton } from '../components/ui/Skeleton';
import { FeedbackModal } from '../components/ui/FeedbackModal';
import { EmptyState } from '../components/ui/EmptyState';
import type { OrderPaymentContext } from '../hooks/usePayment';
import { getUpsellSuggestions } from '../lib/getUpsellSuggestions';
import type { CartLineItem } from '../types/cart';

interface MenuPageProps {
  mode: 'table' | 'delivery';
  menu: MenuDto | undefined;
  isLoading: boolean;
  hasError: boolean;
  paymentContext: OrderPaymentContext | undefined;
  emptyIcon: LucideIcon;
  emptyTitle: string;
  emptyDescription: string;
  onSubmitOrder: (
    payload: CreateOrderInput | CreateDeliveryOrderInput,
  ) => Promise<{ paymentRequired: boolean; order: { id: string; total: number } }>;
  isSubmitting: boolean;
}

const defaultUpsell = {
  drinkCategoryId: null,
  foodOnlyEnabled: false,
  foodOnlyCategoryId: null,
  drinksOnlyEnabled: false,
  drinksOnlyCategoryId: null,
};

export function MenuPage({
  mode,
  menu,
  isLoading,
  hasError,
  paymentContext,
  emptyIcon: EmptyIcon,
  emptyTitle,
  emptyDescription,
  onSubmitOrder,
  isSubmitting,
}: MenuPageProps) {
  const isDelivery = mode === 'delivery';

  const [cart, setCart] = useState<CartLineItem[]>([]);
  const [orderNotes, setOrderNotes] = useState('');
  const [deliveryForm, setDeliveryForm] = useState<DeliveryFormValues>({
    customerName: '',
    customerPhone: '',
    deliveryAddress: '',
  });
  const [orderSuccessOpen, setOrderSuccessOpen] = useState(false);
  const [error, setError] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutOrderId, setCheckoutOrderId] = useState<string | null>(null);
  const [checkoutTotal, setCheckoutTotal] = useState(0);
  const [configureProduct, setConfigureProduct] = useState<ProductDto | null>(null);

  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [cart],
  );

  const itemCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart],
  );

  const upsellSuggestions = useMemo(() => {
    if (!menu) return [];
    return getUpsellSuggestions(cart, menu.categories, menu.upsell ?? defaultUpsell);
  }, [cart, menu]);

  useEffect(() => {
    if (menu?.categories.length && !activeCategory) {
      setActiveCategory(menu.categories[0].id);
    }
  }, [menu, activeCategory]);

  useEffect(() => {
    if (!menu?.categories.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) {
          setActiveCategory(visible[0].target.id.replace('cat-', ''));
        }
      },
      { rootMargin: '-140px 0px -60% 0px', threshold: [0, 0.25, 0.5] },
    );

    menu.categories.forEach((category) => {
      const element = sectionRefs.current[category.id];
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [menu]);

  const scrollToCategory = useCallback((id: string) => {
    setActiveCategory(id);
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const addConfiguredItem = useCallback(
    (payload: {
      product: ProductDto;
      unitPrice: number;
      selections: OrderItemSelectionDto[];
    }) => {
      const lineId = buildCartLineId(payload.product.id, payload.selections);
      setCart((previous) => {
        const existing = previous.find((item) => item.lineId === lineId);
        if (existing) {
          return previous.map((item) =>
            item.lineId === lineId ? { ...item, quantity: item.quantity + 1 } : item,
          );
        }
        return [
          ...previous,
          {
            lineId,
            product: payload.product,
            quantity: 1,
            unitPrice: payload.unitPrice,
            selections: payload.selections,
          },
        ];
      });
      setConfigureProduct(null);
    },
    [],
  );

  const handleProductSelect = useCallback((product: ProductDto) => {
    if (isProductConfigurable(product)) {
      setConfigureProduct(product);
      return;
    }

    addConfiguredItem({
      product,
      unitPrice: product.price,
      selections: [],
    });
  }, [addConfiguredItem]);

  const updateQuantity = useCallback((lineId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((previous) => previous.filter((item) => item.lineId !== lineId));
      return;
    }
    setCart((previous) =>
      previous.map((item) => (item.lineId === lineId ? { ...item, quantity } : item)),
    );
  }, []);

  const updateDeliveryField = useCallback((field: keyof DeliveryFormValues, value: string) => {
    setDeliveryForm((previous) => ({ ...previous, [field]: value }));
  }, []);

  const payBefore = menu?.restaurant.paymentMode === PaymentMode.PAY_BEFORE;
  const submitLabel = payBefore
    ? isDelivery
      ? 'Finalizar pedido'
      : 'Finalizar pedido'
    : isDelivery
      ? 'Finalizar pedido'
      : 'Finalizar pedido';

  const resetAfterOrder = useCallback(() => {
    setCart([]);
    setOrderNotes('');
    setDeliveryForm({ customerName: '', customerPhone: '', deliveryAddress: '' });
    setDrawerOpen(false);
  }, []);

  const handleSubmitOrder = useCallback(async () => {
    if (cart.length === 0) return;

    setError('');

    const items = cart.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
      selections: item.selections.map((selection) => ({
        groupId: selection.groupId,
        optionId: selection.optionId,
      })),
    }));

    try {
      const payload = isDelivery
        ? ({
            items,
            notes: orderNotes || undefined,
            customerName: deliveryForm.customerName.trim(),
            customerPhone: deliveryForm.customerPhone.trim(),
            deliveryAddress: deliveryForm.deliveryAddress.trim(),
          } satisfies CreateDeliveryOrderInput)
        : ({ items, notes: orderNotes || undefined } satisfies CreateOrderInput);

      const response = await onSubmitOrder(payload);

      if (response.paymentRequired) {
        setCheckoutOrderId(response.order.id);
        setCheckoutTotal(response.order.total);
        setCheckoutOpen(true);
        setDrawerOpen(false);
        return;
      }

      resetAfterOrder();
      setOrderSuccessOpen(true);
    } catch {
      setError('Não foi possível enviar o pedido. Tente novamente.');
    }
  }, [cart, deliveryForm, isDelivery, onSubmitOrder, orderNotes, resetAfterOrder]);

  const handlePaymentComplete = useCallback(() => {
    setCheckoutOpen(false);
    setCheckoutOrderId(null);
    resetAfterOrder();
    setOrderSuccessOpen(true);
  }, [resetAfterOrder]);

  if (isLoading) {
    return (
      <MenuLayout restaurantName="Cardápio" subtitle="Carregando...">
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-40 w-full rounded-2xl bg-zinc-900" />
          ))}
        </div>
      </MenuLayout>
    );
  }

  if (!menu) {
    return (
      <MenuLayout restaurantName="Cardápio indisponível">
        <EmptyState
          icon={<EmptyIcon className="h-5 w-5" />}
          title={emptyTitle}
          description={hasError ? emptyDescription : 'Não foi possível carregar o cardápio.'}
        />
      </MenuLayout>
    );
  }

  const tableLabel =
    mode === 'table' && menu.table
      ? menu.table.label
        ? `Mesa ${menu.table.number} · ${menu.table.label}`
        : `Mesa ${menu.table.number}`
      : undefined;

  const cartProps = {
    cart,
    orderNotes,
    total,
    error,
    submitting: isSubmitting,
    submitLabel,
    upsellSuggestions,
    deliveryFields: isDelivery
      ? { values: deliveryForm, onChange: updateDeliveryField }
      : undefined,
    onNotesChange: setOrderNotes,
    onUpdateQuantity: updateQuantity,
    onAddProduct: handleProductSelect,
    onSubmit: handleSubmitOrder,
  };

  const stripeKey =
    menu.payment.stripePublishableKey ??
    import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ??
    null;

  return (
    <>
      <FeedbackModal
        open={orderSuccessOpen}
        onClose={() => setOrderSuccessOpen(false)}
        variant="success"
        title={isDelivery ? 'Pedido de delivery enviado!' : 'Pedido enviado!'}
        description={
          payBefore
            ? isDelivery
              ? 'Pagamento confirmado. Seu pedido já está sendo preparado para entrega.'
              : 'Pagamento confirmado. A cozinha já recebeu seu pedido e em breve começará o preparo.'
            : isDelivery
              ? 'Seu pedido foi enviado e em breve sairá para entrega.'
              : 'Seu pedido foi enviado para a cozinha. Em breve estará pronto para você.'
        }
        confirmLabel="Continuar pedindo"
        onConfirm={() => setOrderSuccessOpen(false)}
      />

      {checkoutOrderId && paymentContext && (
        <PaymentCheckoutModal
          open={checkoutOpen}
          paymentContext={paymentContext}
          orderId={checkoutOrderId}
          total={checkoutTotal}
          stripePublishableKey={stripeKey}
          onClose={() => setCheckoutOpen(false)}
          onPaid={handlePaymentComplete}
        />
      )}

      <ProductConfigureSheet
        product={configureProduct}
        open={configureProduct !== null}
        onClose={() => setConfigureProduct(null)}
        onConfirm={addConfiguredItem}
      />

      <MenuLayout
        restaurantName={menu.restaurant.name}
        subtitle={isDelivery ? 'Delivery' : 'Cardápio digital'}
        badge={tableLabel}
        isDelivery={isDelivery}
        categoryNav={
          menu.categories.length > 1 ? (
            <CategoryNav
              categories={menu.categories.map((category) => ({
                id: category.id,
                name: category.name,
              }))}
              activeId={activeCategory}
              onSelect={scrollToCategory}
            />
          ) : undefined
        }
      >
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-8">
            {menu.categories.map((category) => (
              <ProductCategorySection
                key={category.id}
                category={category}
                onSelectProduct={handleProductSelect}
                sectionRef={(element) => {
                  sectionRefs.current[category.id] = element;
                }}
              />
            ))}
          </div>

          <CartSidebar {...cartProps} />
        </div>
      </MenuLayout>

      <CartDrawer
        {...cartProps}
        open={drawerOpen}
        itemCount={itemCount}
        onOpen={() => setDrawerOpen(true)}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
}
