import { PaymentMode, PAYMENT_MODE_LABELS } from '@pedidonamesa/shared';
import { CheckCircle2, Clock } from 'lucide-react';
import { useRestaurantSettings, useUpdateRestaurantSettings } from '../../hooks/useSettings';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

export function FinanceiroTab() {
  const { data: settings, isLoading } = useRestaurantSettings();
  const updateSettings = useUpdateRestaurantSettings();

  if (isLoading || !settings) {
    return <p className="text-sm text-zinc-500">Carregando configurações...</p>;
  }

  const modes = [PaymentMode.PAY_AFTER, PaymentMode.PAY_BEFORE] as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Financeiro</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Configure quando o cliente deve pagar pelo pedido.
        </p>
      </div>

      <Card className="p-5">
        <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">Modo de pagamento</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Escolha se o cliente paga antes do pedido ir para a cozinha ou depois, no fechamento da
          conta.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {modes.map((mode) => {
            const selected = settings.paymentMode === mode;
            const Icon = mode === PaymentMode.PAY_BEFORE ? CheckCircle2 : Clock;

            return (
              <button
                key={mode}
                type="button"
                disabled={updateSettings.isPending}
                onClick={() => updateSettings.mutate({ paymentMode: mode })}
                className={`rounded-xl border p-4 text-left transition ${
                  selected
                    ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500/20 dark:border-brand-500 dark:bg-brand-950/50 dark:ring-brand-500/30'
                    : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900/40 dark:hover:border-zinc-600'
                } ${updateSettings.isPending ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 rounded-lg p-2 ${
                      selected
                        ? 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300'
                        : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p
                      className={`font-medium ${
                        selected
                          ? 'text-zinc-900 dark:text-zinc-50'
                          : 'text-zinc-900 dark:text-zinc-100'
                      }`}
                    >
                      {PAYMENT_MODE_LABELS[mode]}
                    </p>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      {mode === PaymentMode.PAY_BEFORE
                        ? 'Cliente paga via Pix, cartão, Apple Pay ou Google Pay antes da cozinha receber.'
                        : 'Comanda aberta. O pagamento será feito depois (PDV/maquininha em breve).'}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {updateSettings.isSuccess && (
          <p className="mt-4 text-sm text-green-600 dark:text-green-400">
            Configuração salva com sucesso.
          </p>
        )}
      </Card>

      {settings.paymentMode === PaymentMode.PAY_BEFORE && (
        <Card className="p-5">
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">Formas de pagamento</h2>
          <ul className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
            <li>• Pix (Mercado Pago)</li>
            <li>• Cartão de crédito/débito (Stripe)</li>
            <li>• Apple Pay e Google Pay (via Stripe)</li>
          </ul>
          <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-500">
            Chaves de teste configuradas no servidor. Em produção, substitua pelas credenciais reais.
          </p>
        </Card>
      )}

      {settings.paymentMode === PaymentMode.PAY_AFTER && (
        <Card className="p-5">
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">Próximo passo</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Com este modo, o cliente envia pedidos normalmente e paga no final. Em breve você poderá
            fechar a conta pelo PDV integrado à maquininha.
          </p>
          <Button className="mt-4" variant="outline" disabled>
            PDV maquininha — em breve
          </Button>
        </Card>
      )}
    </div>
  );
}
