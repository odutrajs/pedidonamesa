import { memo, useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Copy, Download, ExternalLink, Plus, QrCode, RefreshCw, Table2 } from 'lucide-react';
import { useCreateTable, useRegenerateTableToken, useTables } from '../../hooks/useAdmin';
import type { TableFormValues, TableRow } from '../../types/admin';
import { formConfig, tableNumberRules } from '../../lib/validation';
import { downloadTableQrCode, generateQrDataUrl } from '../../lib/qr-code';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { FieldError, Input } from '../ui/Input';
import { Skeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';

const TableItem = memo(function TableItem({
  table,
  onRegenerate,
  isRegenerating,
}: {
  table: TableRow;
  onRegenerate: (id: string) => void;
  isRegenerating: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const menuUrl = `${window.location.origin}/mesa/${table.token}`;

  useEffect(() => {
    let cancelled = false;

    generateQrDataUrl(menuUrl, 128)
      .then((dataUrl) => {
        if (!cancelled) setQrPreview(dataUrl);
      })
      .catch(() => {
        if (!cancelled) setQrPreview(null);
      });

    return () => {
      cancelled = true;
    };
  }, [menuUrl]);

  const copyLink = useCallback(async () => {
    await navigator.clipboard.writeText(menuUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [menuUrl]);

  const downloadQr = useCallback(async () => {
    setDownloading(true);
    try {
      await downloadTableQrCode({
        url: menuUrl,
        number: table.number,
        label: table.label,
      });
    } finally {
      setDownloading(false);
    }
  }, [menuUrl, table.label, table.number]);

  return (
    <li className="px-4 py-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-white p-1 dark:border-zinc-700 dark:bg-zinc-900">
            {qrPreview ? (
              <img
                src={qrPreview}
                alt={`QR Code da mesa ${table.number}`}
                className="h-full w-full object-contain"
              />
            ) : (
              <QrCode className="h-8 w-8 text-zinc-300" />
            )}
          </div>
          <div>
            <p className="font-medium text-zinc-900 dark:text-zinc-50">
              Mesa {table.number}
              {table.label ? ` — ${table.label}` : ''}
            </p>
            <p className="mt-1 font-mono text-xs text-zinc-400 dark:text-zinc-500">{table.token}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a href={menuUrl} target="_blank" rel="noreferrer">
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Abrir cardápio
                </Button>
              </a>
              <Button variant="ghost" size="sm" onClick={copyLink}>
                <Copy className="h-3.5 w-3.5" />
                {copied ? 'Copiado!' : 'Copiar link'}
              </Button>
              <Button variant="ghost" size="sm" disabled={downloading} onClick={downloadQr}>
                <Download className="h-3.5 w-3.5" />
                {downloading ? 'Baixando...' : 'Baixar QR'}
              </Button>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={isRegenerating}
          onClick={() => onRegenerate(table.id)}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
          {isRegenerating ? 'Gerando...' : 'Novo QR'}
        </Button>
      </div>
    </li>
  );
});

export const TablesTab = memo(function TablesTab() {
  const { data: tables = [], isLoading } = useTables();
  const createTable = useCreateTable();
  const regenerateToken = useRegenerateTableToken();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<TableFormValues>({
    ...formConfig,
    defaultValues: { number: '', label: '' },
  });

  function onSubmit(data: TableFormValues) {
    createTable.mutate(data, {
      onSuccess: () => reset(),
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Mesas</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Cada mesa recebe um QR Code único para o cardápio digital.
        </p>
      </div>

      <Card className="flex flex-wrap items-end gap-3">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-wrap items-end gap-3">
          <div>
            <Input
              className="max-w-[120px]"
              placeholder="Número"
              type="number"
              min={1}
              step={1}
              {...register('number', tableNumberRules)}
            />
            <FieldError message={errors.number?.message} />
          </div>
          <Input className="max-w-xs flex-1" placeholder="Label (opcional)" {...register('label')} />
          <Button type="submit" disabled={!isValid || createTable.isPending}>
            <Plus className="h-4 w-4" />
            {createTable.isPending ? 'Criando...' : 'Criar mesa'}
          </Button>
        </form>
      </Card>

      {tables.length === 0 ? (
        <EmptyState
          icon={<Table2 className="h-5 w-5" />}
          title="Nenhuma mesa"
          description="Crie mesas para gerar QR Codes e começar a receber pedidos."
        />
      ) : (
        <ul className="divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {tables.map((t: TableRow) => (
            <TableItem
              key={t.id}
              table={t}
              onRegenerate={(id) => regenerateToken.mutate(id)}
              isRegenerating={
                regenerateToken.isPending && regenerateToken.variables === t.id
              }
            />
          ))}
        </ul>
      )}
    </div>
  );
});
