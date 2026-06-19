import { Copy, ExternalLink, Truck } from 'lucide-react';
import { useRestaurantSettings } from '../../hooks/useSettings';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export function DeliveryTab() {
  const { data: settings, isLoading } = useRestaurantSettings();

  if (isLoading || !settings) {
    return <p className="text-sm text-zinc-500">Carregando...</p>;
  }

  const deliveryUrl = `${window.location.origin}/entrega/${settings.slug}`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Delivery</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Link público do cardápio de delivery. Produtos precisam estar marcados para o canal
          Delivery na aba Produtos.
        </p>
      </div>

      <Card className="p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-brand-100 p-2 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
            <Truck className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Link do cardápio</h3>
            <p className="mt-1 break-all rounded-lg bg-zinc-50 px-3 py-2 font-mono text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
              {deliveryUrl}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => navigator.clipboard.writeText(deliveryUrl)}
              >
                <Copy className="h-3.5 w-3.5" />
                Copiar link
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => window.open(deliveryUrl, '_blank')}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Abrir cardápio
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
