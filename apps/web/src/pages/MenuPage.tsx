import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { CreateDeliveryOrderInput, CreateOrderInput, MenuDto, ProductDto } from '@pedidonamesa/shared';
import { PaymentMode } from '@pedidonamesa/shared';
import { MenuLayout } from '../components/menu/MenuLayout';
import { CategoryNav } from '../components/menu/CategoryNav';
import { CartSidebar, type DeliveryFormValues } from '../components/menu/CartSidebar';
import { CartDrawer } from '../components/menu/CartDrawer';
import { ProductCard } from '../components/menu/ProductCard';
import { PaymentCheckoutModal } from '../components/payment/PaymentCheckoutModal';
import { ProductCardSkeleton } from '../components/ui/Skeleton';
import { FeedbackModal } from '../components/ui/FeedbackModal';
import { EmptyState } from '../components/ui/EmptyState';
import type { OrderPaymentContext } from '../hooks/usePayment';
import { getUpsellSuggestions } from '../lib/getUpsellSuggestions';

interface CartItem {
  product: ProductDto;
  quantity: number;
}

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

  const [cart, setCart] = useState<CartItem[]>([]);
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

  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
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
      { rootMargin: '-120px 0px -60% 0px', threshold: [0, 0.25, 0.5] },
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

  const addToCart = useCallback((product: ProductDto) => {
    setCart((previous) => {
      const existing = previous.find((item) => item.product.id === product.id);
      if (existing) {
        return previous.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      return [...previous, { product, quantity: 1 }];
    });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((previous) => previous.filter((item) => item.product.id !== productId));
      return;
    }
    setCart((previous) =>
      previous.map((item) => (item.product.id === productId ? { ...item, quantity } : item)),
    );
  }, []);

  const updateDeliveryField = useCallback((field: keyof DeliveryFormValues, value: string) => {
    setDeliveryForm((previous) => ({ ...previous, [field]: value }));
  }, []);

  const payBefore = menu?.restaurant.paymentMode === PaymentMode.PAY_BEFORE;
  const submitLabel = payBefore
    ? isDelivery
      ? 'Pagar e pedir delivery'
      : 'Pagar e enviar pedido'
    : isDelivery
      ? 'Pedir delivery'
      : 'Enviar pedido';

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
      <MenuLayout>
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      </MenuLayout>
    );
  }

  if (!menu) {
    return (
      <MenuLayout>
        <EmptyState
          icon={<EmptyIcon className="h-5 w-5" />}
          title={emptyTitle}
          description={hasError ? emptyDescription : 'Não foi possível carregar o cardápio.'}
        />
      </MenuLayout>
    );
  }

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
    onAddProduct: addToCart,
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

      <MenuLayout
        categoryNav={
          menu.categories.length > 1 ? (
            <CategoryNav
              categories={menu.categories.map((category) => ({ id: category.id, name: category.name }))}
              activeId={activeCategory}
              onSelect={scrollToCategory}
            />
          ) : undefined
        }
      >
        {isDelivery && (
          <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
            Delivery · {menu.restaurant.name}
          </p>
        )}

        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="space-y-10">
            {menu.categories.map((category) => (
              <section
                key={category.id}
                id={`cat-${category.id}`}
                ref={(element) => {
                  sectionRefs.current[category.id] = element;
                }}
                className="section-scroll"
              >
                <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  {category.name}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {category.products.map((product) => (
                    <ProductCard key={product.id} product={product} onAdd={addToCart} />
                  ))}
                </div>
              </section>
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
