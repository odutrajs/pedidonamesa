import { memo } from 'react';
import { useForm } from 'react-hook-form';
import { useCreateTable, useRegenerateTableToken, useTables } from '../../hooks/useAdmin';
import type { TableFormValues, TableRow } from '../../types/admin';

const TableItem = memo(function TableItem({
  table,
  onRegenerate,
  isRegenerating,
}: {
  table: TableRow;
  onRegenerate: (id: string) => void;
  isRegenerating: boolean;
}) {
  return (
    <li className="card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold">
            Mesa {table.number}
            {table.label ? ` — ${table.label}` : ''}
          </p>
          <p className="mt-1 break-all text-xs text-stone-500">Token: {table.token}</p>
          <a
            className="mt-2 inline-block text-sm font-medium text-brand-700"
            href={`/mesa/${table.token}`}
            target="_blank"
            rel="noreferrer"
          >
            Abrir cardápio da mesa →
          </a>
        </div>
        <button
          className="btn-secondary"
          disabled={isRegenerating}
          onClick={() => onRegenerate(table.id)}
        >
          {isRegenerating ? 'Gerando...' : 'Novo QR'}
        </button>
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
    return <p className="text-stone-500">Carregando mesas...</p>;
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit(onSubmit)} className="card flex flex-wrap gap-3 p-4">
        <input
          className="input max-w-[120px]"
          placeholder="Número"
          type="number"
          {...register('number')}
        />
        <input className="input max-w-xs" placeholder="Label (opcional)" {...register('label')} />
        <button className="btn-primary" disabled={createTable.isPending}>
          {createTable.isPending ? 'Criando...' : 'Criar mesa'}
        </button>
      </form>
      <ul className="space-y-3">
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
    </div>
  );
});
