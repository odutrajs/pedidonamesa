import { memo, useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Copy, ExternalLink, Plus, QrCode, RefreshCw, Table2 } from 'lucide-react';
import { useCreateTable, useRegenerateTableToken, useTables } from '../../hooks/useAdmin';
import type { TableFormValues, TableRow } from '../../types/admin';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
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
  const menuUrl = `${window.location.origin}/mesa/${table.token}`;

  const copyLink = useCallback(async () => {
    await navigator.clipboard.writeText(menuUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [menuUrl]);

  return (
    <li className="px-4 py-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50">
            <QrCode className="h-8 w-8 text-zinc-300" />
          </div>
          <div>
            <p className="font-medium text-zinc-900">
              Mesa {table.number}
              {table.label ? ` — ${table.label}` : ''}
            </p>
            <p className="mt-1 font-mono text-xs text-zinc-400">{table.token}</p>
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
  const { register, handleSubmit, reset } = useForm<TableFormValues>({
    defaultValues: { number: '', label: '' },
  });

  function onSubmit(data: TableFormValues) {
    if (!data.number) return;
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
        <h2 className="text-lg font-semibold text-zinc-900">Mesas</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Cada mesa recebe um QR Code único para o cardápio digital.
        </p>
      </div>

      <Card className="flex flex-wrap items-end gap-3">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-wrap items-end gap-3">
          <Input
            className="max-w-[120px]"
            placeholder="Número"
            type="number"
            {...register('number')}
          />
          <Input className="max-w-xs flex-1" placeholder="Label (opcional)" {...register('label')} />
          <Button type="submit" disabled={createTable.isPending}>
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
        <ul className="divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 bg-white">
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
