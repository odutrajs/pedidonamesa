import { useEffect, useRef, useState } from 'react';
import { CreditCard, QrCode, X } from 'lucide-react';
import type { PixCheckoutDto } from '@pedidonamesa/shared';
import { PaymentStatus } from '@pedidonamesa/shared';
import { formatCurrency } from '../../lib/utils';
import {
  useConfirmStripePayment,
  useCreatePixCheckout,
  useCreateStripeCheckout,
  useMockPayment,
  usePaymentStatus,
} from '../../hooks/usePayment';
import { Button } from '../ui/Button';
import { PixCheckoutView } from './PixCheckoutView';
import { StripeCheckout } from './StripeCheckout';

type PaymentTab = 'card' | 'pix';

interface PaymentCheckoutModalProps {
  open: boolean;
  tableToken: string;
  orderId: string;
  total: number;
  stripePublishableKey: string | null;
  onClose: () => void;
  onPaid: () => void;
}

export function PaymentCheckoutModal({
  open,
  tableToken,
  orderId,
  total,
  stripePublishableKey,
  onClose,
  onPaid,
}: PaymentCheckoutModalProps) {
  const [tab, setTab] = useState<PaymentTab>('card');
  const [error, setError] = useState('');
  const [stripeSecret, setStripeSecret] = useState<string | null>(null);
  const [pixData, setPixData] = useState<PixCheckoutDto | null>(null);
  const [confirmingBackend, setConfirmingBackend] = useState(false);

  const stripeLoadStarted = useRef(false);
  const pixLoadStarted = useRef(false);

  const createStripe = useCreateStripeCheckout(tableToken);
  const createPix = useCreatePixCheckout(tableToken);
  const confirmStripe = useConfirmStripePayment(tableToken);
  const mockPayment = useMockPayment(tableToken);
  const paymentStatus = usePaymentStatus(tableToken, orderId, open && tab === 'pix' && !!pixData);

  useEffect(() => {
    if (paymentStatus.data?.paymentStatus === PaymentStatus.PAID) {
      onPaid();
    }
  }, [paymentStatus.data?.paymentStatus, onPaid]);

  useEffect(() => {
    if (!open) {
      setTab('card');
      setError('');
      setStripeSecret(null);
      setPixData(null);
      setConfirmingBackend(false);
      stripeLoadStarted.current = false;
      pixLoadStarted.current = false;
      return;
    }

    if (tab === 'card' && !stripeLoadStarted.current && stripePublishableKey) {
      stripeLoadStarted.current = true;
      createStripe.mutate(orderId, {
        onSuccess: (data) => setStripeSecret(data.clientSecret),
        onError: () => setError('Não foi possível iniciar o pagamento com cartão.'),
      });
    }

    if (tab === 'pix' && !pixLoadStarted.current) {
      pixLoadStarted.current = true;
      createPix.mutate(orderId, {
        onSuccess: (data) => setPixData(data),
        onError: () => setError('Não foi possível gerar o Pix.'),
      });
    }
  }, [open, tab, orderId, stripePublishableKey, createStripe, createPix]);

  if (!open) return null;

  const handleStripeSuccess = (paymentIntentId: string) => {
    setConfirmingBackend(true);
    confirmStripe.mutate(
      { orderId, paymentIntentId },
      {
        onSuccess: () => onPaid(),
        onError: () => {
          setConfirmingBackend(false);
          setError('Pagamento recebido, mas houve erro ao confirmar. Aguarde ou tente novamente.');
        },
      },
    );
  };

  const handleMockPayment = () => {
    mockPayment.mutate(orderId, {
      onSuccess: () => onPaid(),
      onError: () => setError('Não foi possível simular o pagamento.'),
    });
  };

  const isDev = import.meta.env.DEV;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Pagamento do pedido
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Total: {formatCurrency(total)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={confirmingBackend}
            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
          <button
            type="button"
            className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              tab === 'card'
                ? 'bg-white text-zinc-900 shadow dark:bg-zinc-900 dark:text-zinc-50'
                : 'text-zinc-600 dark:text-zinc-400'
            }`}
            onClick={() => {
              setTab('card');
              setError('');
            }}
          >
            <CreditCard className="h-4 w-4" />
            Cartão / Wallets
          </button>
          <button
            type="button"
            className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              tab === 'pix'
                ? 'bg-white text-zinc-900 shadow dark:bg-zinc-900 dark:text-zinc-50'
                : 'text-zinc-600 dark:text-zinc-400'
            }`}
            onClick={() => {
              setTab('pix');
              setError('');
            }}
          >
            <QrCode className="h-4 w-4" />
            Pix
          </button>
        </div>

        {error && <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

        {confirmingBackend && (
          <p className="mb-4 text-sm text-zinc-500">Confirmando pagamento com o restaurante...</p>
        )}

        {tab === 'card' && (
          <>
            {!stripePublishableKey ? (
              <p className="text-sm text-zinc-500">Pagamento com cartão indisponível no momento.</p>
            ) : stripeSecret ? (
              <StripeCheckout
                clientSecret={stripeSecret}
                publishableKey={stripePublishableKey}
                onSuccess={handleStripeSuccess}
                onError={setError}
                onConfirming={setConfirmingBackend}
              />
            ) : (
              <p className="py-8 text-center text-sm text-zinc-500">Carregando pagamento...</p>
            )}

            {isDev && (
              <Button
                variant="outline"
                className="mt-4 w-full"
                disabled={mockPayment.isPending || confirmingBackend}
                onClick={handleMockPayment}
              >
                Simular pagamento (dev)
              </Button>
            )}
          </>
        )}

        {tab === 'pix' && (
          <>
            {pixData ? (
              <PixCheckoutView pix={pixData} polling={paymentStatus.isFetching} />
            ) : (
              <p className="py-8 text-center text-sm text-zinc-500">Gerando Pix...</p>
            )}

            {isDev && (
              <Button
                variant="outline"
                className="mt-4 w-full"
                disabled={mockPayment.isPending}
                onClick={handleMockPayment}
              >
                Simular pagamento (dev)
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
