import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { QrCode } from 'lucide-react';
import type { CreateOrderInput, ProductDto } from '@pedidonamesa/shared';
import { PaymentMode } from '@pedidonamesa/shared';
import { MenuLayout } from '../components/menu/MenuLayout';
import { CategoryNav } from '../components/menu/CategoryNav';
import { CartSidebar } from '../components/menu/CartSidebar';
import { CartDrawer } from '../components/menu/CartDrawer';
import { ProductCard } from '../components/menu/ProductCard';
import { PaymentCheckoutModal } from '../components/payment/PaymentCheckoutModal';
import { ProductCardSkeleton } from '../components/ui/Skeleton';
import { FeedbackModal } from '../components/ui/FeedbackModal';
import { EmptyState } from '../components/ui/EmptyState';
import { useMenu, useSubmitOrder } from '../hooks/useMenu';

interface CartItem {
  product: ProductDto;
  quantity: number;
}

export function TableMenuPage() {
  const { token } = useParams<{ token: string }>();
  const { data: menu, isLoading, error: menuError } = useMenu(token);
  const submitOrder = useSubmitOrder(token);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderNotes, setOrderNotes] = useState('');
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
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) {
          setActiveCategory(visible[0].target.id.replace('cat-', ''));
        }
      },
      { rootMargin: '-120px 0px -60% 0px', threshold: [0, 0.25, 0.5] },
    );

    menu.categories.forEach((cat) => {
      const el = sectionRefs.current[cat.id];
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [menu]);

  const scrollToCategory = useCallback((id: string) => {
    setActiveCategory(id);
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const addToCart = useCallback((product: ProductDto) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((i) => i.product.id !== productId));
      return;
    }
    setCart((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, quantity } : i)),
    );
  }, []);

  const payBefore = menu?.restaurant.paymentMode === PaymentMode.PAY_BEFORE;
  const submitLabel = payBefore ? 'Pagar e enviar pedido' : 'Enviar pedido';

  const handleSubmitOrder = useCallback(() => {
    if (!token || cart.length === 0) return;

    setError('');

    const payload: CreateOrderInput = {
      items: cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      })),
      notes: orderNotes || undefined,
    };

    submitOrder.mutate(payload, {
      onSuccess: (response) => {
        if (response.paymentRequired) {
          setCheckoutOrderId(response.order.id);
          setCheckoutTotal(response.order.total);
          setCheckoutOpen(true);
          setDrawerOpen(false);
          return;
        }

        setCart([]);
        setOrderNotes('');
        setDrawerOpen(false);
        setOrderSuccessOpen(true);
      },
      onError: () => {
        setError('Não foi possível enviar o pedido. Tente novamente.');
      },
    });
  }, [token, cart, orderNotes, submitOrder]);

  const handlePaymentComplete = useCallback(() => {
    setCheckoutOpen(false);
    setCheckoutOrderId(null);
    setCart([]);
    setOrderNotes('');
    setOrderSuccessOpen(true);
  }, []);

  if (isLoading) {
    return (
      <MenuLayout>
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </MenuLayout>
    );
  }

  if (!menu) {
    return (
      <MenuLayout>
        <EmptyState
          icon={<QrCode className="h-5 w-5" />}
          title="QR Code inválido"
          description={
            menuError
              ? 'Esta mesa não foi encontrada. Peça ao garçom um novo QR Code.'
              : 'Não foi possível carregar o cardápio. Verifique o link e tente novamente.'
          }
        />
      </MenuLayout>
    );
  }

  const cartProps = {
    cart,
    orderNotes,
    total,
    error,
    submitting: submitOrder.isPending,
    submitLabel,
    onNotesChange: setOrderNotes,
    onUpdateQuantity: updateQuantity,
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
        title="Pedido enviado!"
        description={
          payBefore
            ? 'Pagamento confirmado. A cozinha já recebeu seu pedido e em breve começará o preparo.'
            : 'Seu pedido foi enviado para a cozinha. Em breve estará pronto para você.'
        }
        confirmLabel="Continuar pedindo"
        onConfirm={() => setOrderSuccessOpen(false)}
      />

      {checkoutOrderId && token && (
        <PaymentCheckoutModal
          open={checkoutOpen}
          tableToken={token}
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
              categories={menu.categories.map((c) => ({ id: c.id, name: c.name }))}
              activeId={activeCategory}
              onSelect={scrollToCategory}
            />
          ) : undefined
        }
      >
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="space-y-10">
            {menu.categories.map((category) => (
              <section
                key={category.id}
                id={`cat-${category.id}`}
                ref={(el) => {
                  sectionRefs.current[category.id] = el;
                }}
                className="section-scroll"
              >
                <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">{category.name}</h2>
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
