import { Copy, Loader2 } from 'lucide-react';
import { useState } from 'react';
import type { PixCheckoutDto } from '@pedidonamesa/shared';
import { Button } from '../ui/Button';

interface PixCheckoutViewProps {
  pix: PixCheckoutDto;
  polling: boolean;
}

export function PixCheckoutView({ pix, polling }: PixCheckoutViewProps) {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    await navigator.clipboard.writeText(pix.qrCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 text-center">
      {pix.qrCodeBase64 ? (
        <img
          src={`data:image/png;base64,${pix.qrCodeBase64}`}
          alt="QR Code Pix"
          className="mx-auto h-52 w-52 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-700"
        />
      ) : null}

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Escaneie o QR Code ou copie o código Pix abaixo
      </p>

      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-left dark:border-zinc-700 dark:bg-zinc-800/50">
        <p className="break-all font-mono text-xs text-zinc-700 dark:text-zinc-300">{pix.qrCode}</p>
      </div>

      <Button variant="secondary" className="w-full" onClick={copyCode}>
        <Copy className="mr-2 h-4 w-4" />
        {copied ? 'Copiado!' : 'Copiar código Pix'}
      </Button>

      {polling && (
        <div className="flex items-center justify-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Aguardando confirmação do pagamento...
        </div>
      )}
    </div>
  );
}
