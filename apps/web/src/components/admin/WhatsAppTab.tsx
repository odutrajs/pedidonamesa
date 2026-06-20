import { Loader2, MessageCircle, PauseCircle, PlayCircle, QrCode, RefreshCw, Unplug } from 'lucide-react';
import { cn } from '../../lib/cn';
import { useDisconnectWhatsApp, useWhatsAppConnection } from '../../hooks/useWhatsAppConnection';
import { useRestaurantSettings, useUpdateRestaurantSettings } from '../../hooks/useSettings';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Label, Textarea, Input } from '../ui/Input';

const STATE_LABELS: Record<string, string> = {
  unconfigured: 'Não configurado',
  offline: 'Serviço offline',
  connecting: 'Conectando...',
  qr_pending: 'Aguardando QR code',
  connected: 'Conectado',
  logged_out: 'Desconectado',
  disconnected: 'Reconectando...',
};

function StatusBadge({ state }: { state: string }) {
  const styles: Record<string, string> = {
    connected: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300',
    qr_pending: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300',
    connecting: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300',
    offline: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300',
    unconfigured: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
    logged_out: 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300',
    disconnected: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300',
  };

  return (
    <span
      className={cn(
        'rounded-full px-2.5 py-1 text-xs font-semibold',
        styles[state] ?? styles.unconfigured,
      )}
    >
      {STATE_LABELS[state] ?? state}
    </span>
  );
}

export function WhatsAppTab() {
  const { data: settings, isLoading } = useRestaurantSettings();
  const updateSettings = useUpdateRestaurantSettings();
  const { data: connection, isLoading: connectionLoading, refetch, isFetching } = useWhatsAppConnection();
  const disconnect = useDisconnectWhatsApp();

  if (isLoading || !settings) {
    return <p className="text-sm text-zinc-500">Carregando...</p>;
  }

  const deliveryUrl = `${window.location.origin}/entrega/${settings.slug}`;
  const showQr =
    connection?.qrDataUrl &&
    (connection.state === 'qr_pending' || connection.state === 'connecting');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">WhatsApp Bot</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Conecte o WhatsApp, configure mensagens automáticas e pause o bot quando quiser atendimento
          humano. O serviço Baileys roda separado do deploy principal.
        </p>
      </div>

      <Card className="space-y-5 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
              <QrCode className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Conexão WhatsApp</h3>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Escaneie o QR code em WhatsApp → Aparelhos conectados → Conectar aparelho.
              </p>
            </div>
          </div>

          {connection && <StatusBadge state={connection.state} />}
        </div>

        {connectionLoading ? (
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando status da conexão...
          </div>
        ) : (
          <>
            {connection?.message && (
              <p className="text-sm text-zinc-600 dark:text-zinc-300">{connection.message}</p>
            )}

            {connection?.connectedPhone && connection.state === 'connected' && (
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                Número conectado: {connection.connectedPhone}
              </p>
            )}

            {showQr && (
              <div className="flex flex-col items-start gap-3">
                <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-950">
                  <img
                    src={connection.qrDataUrl!}
                    alt="QR code WhatsApp"
                    className="h-[280px] w-[280px]"
                  />
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  O QR code expira em cerca de 60 segundos e atualiza automaticamente aqui.
                </p>
              </div>
            )}

            {!connection?.configured && (
              <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-300">
                Configure <code className="text-xs">WHATSAPP_BOT_SERVICE_URL</code> em{' '}
                <code className="text-xs">apps/api/.env</code>, reinicie a API e suba o bot com{' '}
                <code className="text-xs">pnpm dev:whatsapp</code> (local) ou{' '}
                <code className="text-xs">docker compose -f docker-compose.whatsapp.yaml up -d</code>{' '}
                (produção).
              </div>
            )}

            {connection?.configured && !connection.reachable && (
              <div className="rounded-lg border border-dashed border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                O serviço do bot não está acessível pela API. Inicie com{' '}
                <code className="text-xs">pnpm dev:whatsapp</code> (local) ou verifique o container
                whatsapp-bot no servidor.
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isFetching}
                onClick={() => refetch()}
              >
                {isFetching ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                Atualizar
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={
                  disconnect.isPending ||
                  !connection?.reachable ||
                  connection.state === 'offline' ||
                  connection.state === 'unconfigured'
                }
                onClick={() => disconnect.mutate()}
              >
                {disconnect.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Unplug className="h-3.5 w-3.5" />
                )}
                Gerar novo QR code
              </Button>
            </div>
          </>
        )}
      </Card>

      <Card className="space-y-5 p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
            <MessageCircle className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Status do bot</h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Quando pausado, o bot informa que um atendente humano assumirá a conversa.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-700">
            <input
              type="checkbox"
              checked={settings.whatsappBotEnabled}
              disabled={updateSettings.isPending}
              onChange={(event) => updateSettings.mutate({ whatsappBotEnabled: event.target.checked })}
            />
            <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Bot ativo</span>
          </label>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={updateSettings.isPending || !settings.whatsappBotEnabled}
            onClick={() => updateSettings.mutate({ whatsappBotPaused: !settings.whatsappBotPaused })}
          >
            {settings.whatsappBotPaused ? (
              <>
                <PlayCircle className="h-3.5 w-3.5" />
                Retomar respostas automáticas
              </>
            ) : (
              <>
                <PauseCircle className="h-3.5 w-3.5" />
                Pausar bot (atendimento humano)
              </>
            )}
          </Button>
        </div>
      </Card>

      <Card className="space-y-4 p-5">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Mensagens e informações</h3>

        <div>
          <Label htmlFor="whatsapp-welcome">Mensagem de boas-vindas</Label>
          <Textarea
            id="whatsapp-welcome"
            rows={4}
            placeholder="Deixe em branco para usar a mensagem padrão do sistema."
            defaultValue={settings.whatsappWelcomeMessage ?? ''}
            disabled={updateSettings.isPending}
            onBlur={(event) => {
              const value = event.target.value.trim();
              if (value === (settings.whatsappWelcomeMessage ?? '')) return;
              updateSettings.mutate({ whatsappWelcomeMessage: value || null });
            }}
          />
        </div>

        <div>
          <Label htmlFor="whatsapp-hours">Horário de funcionamento</Label>
          <Input
            id="whatsapp-hours"
            placeholder="Ex: Seg a Sáb, 18h às 23h"
            defaultValue={settings.whatsappBusinessHours ?? ''}
            disabled={updateSettings.isPending}
            onBlur={(event) => {
              const value = event.target.value.trim();
              if (value === (settings.whatsappBusinessHours ?? '')) return;
              updateSettings.mutate({ whatsappBusinessHours: value || null });
            }}
          />
        </div>

        <div>
          <Label htmlFor="whatsapp-address">Endereço</Label>
          <Textarea
            id="whatsapp-address"
            rows={2}
            placeholder="Rua, número, bairro — usado quando o cliente pedir endereço."
            defaultValue={settings.whatsappAddress ?? ''}
            disabled={updateSettings.isPending}
            onBlur={(event) => {
              const value = event.target.value.trim();
              if (value === (settings.whatsappAddress ?? '')) return;
              updateSettings.mutate({ whatsappAddress: value || null });
            }}
          />
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Link enviado automaticamente</h3>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Quando o cliente pedir cardápio ou menu, o bot envia este link de delivery:
        </p>
        <p className="mt-3 break-all rounded-lg bg-zinc-50 px-3 py-2 font-mono text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
          {deliveryUrl}
        </p>
      </Card>
    </div>
  );
}
