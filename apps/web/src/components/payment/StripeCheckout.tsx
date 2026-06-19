import { useState } from 'react';
import {
  Elements,
  ExpressCheckoutElement,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import type { StripeExpressCheckoutElementConfirmEvent } from '@stripe/stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';

interface StripeCheckoutFormProps {
  onSuccess: (paymentIntentId: string) => void;
  onError: (message: string) => void;
  onConfirming?: (confirming: boolean) => void;
}

function CheckoutForm({ onSuccess, onError, onConfirming }: StripeCheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [expressReady, setExpressReady] = useState(false);
  const [expressAvailable, setExpressAvailable] = useState(false);

  const confirmPayment = async () => {
    if (!stripe || !elements) return false;

    const { error: submitError } = await elements.submit();
    if (submitError) {
      onError(submitError.message ?? 'Verifique os dados do cartão.');
      return false;
    }

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
      confirmParams: {
        payment_method_data: {
          billing_details: {
            address: { country: 'BR' },
          },
        },
      },
    });

    if (error) {
      onError(error.message ?? 'Não foi possível processar o pagamento.');
      return false;
    }

    if (paymentIntent?.status === 'succeeded') {
      onSuccess(paymentIntent.id);
      return true;
    }

    if (paymentIntent?.status === 'processing') {
      onError('Pagamento em processamento. Aguarde a confirmação.');
      return false;
    }

    onError('Pagamento não concluído. Tente novamente.');
    return false;
  };

  const runPayment = async () => {
    setSubmitting(true);
    onConfirming?.(true);
    try {
      await confirmPayment();
    } finally {
      setSubmitting(false);
      onConfirming?.(false);
    }
  };

  const handleExpressConfirm = async (_event: StripeExpressCheckoutElementConfirmEvent) => {
    await runPayment();
  };

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Pagamento rápido</p>
        <ExpressCheckoutElement
          options={{
            buttonHeight: 48,
            billingAddressRequired: false,
            emailRequired: false,
            phoneNumberRequired: false,
            paymentMethods: {
              applePay: 'always',
              googlePay: 'always',
              link: 'never',
              paypal: 'never',
            },
            buttonType: {
              applePay: 'buy',
              googlePay: 'buy',
            },
          }}
          onReady={({ availablePaymentMethods }) => {
            setExpressReady(true);
            setExpressAvailable(!!availablePaymentMethods);
          }}
          onConfirm={handleExpressConfirm}
        />
        {!expressReady && (
          <p className="text-center text-xs text-zinc-400">Carregando carteiras digitais...</p>
        )}
        {expressReady && !expressAvailable && (
          <p className="rounded-lg bg-zinc-50 px-3 py-2 text-center text-xs text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-400">
            Apple Pay e Google Pay disponíveis em HTTPS com cartão cadastrado na carteira.
          </p>
        )}
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-zinc-200 dark:border-zinc-700" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-zinc-400 dark:bg-zinc-900">ou cartão</span>
        </div>
      </div>

      <PaymentElement
        options={{
          layout: 'tabs',
          wallets: {
            applePay: 'never',
            googlePay: 'never',
            link: 'never',
          },
          fields: {
            billingDetails: {
              name: 'auto',
              email: 'never',
              phone: 'never',
              address: {
                country: 'never',
                postalCode: 'never',
                line1: 'never',
                line2: 'never',
                city: 'never',
                state: 'never',
              },
            },
          },
        }}
      />

      <Button className="w-full" disabled={!stripe || submitting} onClick={runPayment}>
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processando...
          </>
        ) : (
          'Pagar com cartão'
        )}
      </Button>

      <p className="text-center text-xs text-zinc-400">
        Teste: 4242 4242 4242 4242 · validade futura · CVV 123
      </p>
    </div>
  );
}

interface StripeCheckoutProps {
  clientSecret: string;
  publishableKey: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (message: string) => void;
  onConfirming?: (confirming: boolean) => void;
}

export function StripeCheckout({
  clientSecret,
  publishableKey,
  onSuccess,
  onError,
  onConfirming,
}: StripeCheckoutProps) {
  const [stripePromise] = useState(() => loadStripe(publishableKey));

  if (!clientSecret) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#ea580c',
            borderRadius: '10px',
          },
        },
        locale: 'pt-BR',
      }}
    >
      <CheckoutForm onSuccess={onSuccess} onError={onError} onConfirming={onConfirming} />
    </Elements>
  );
}
