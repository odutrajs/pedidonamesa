import { useMemo, useState } from 'react';
import {
  Banknote,
  BarChart3,
  CheckCircle2,
  Clock,
  FileText,
  Plus,
  Receipt,
  Settings2,
  Trash2,
  Wallet,
} from 'lucide-react';
import {
  EXPENSE_CATEGORY_LABELS,
  ExpenseCategory,
  MENU_CHANNEL_LABELS,
  PaymentMode,
  PAYMENT_MODE_LABELS,
} from '@pedidonamesa/shared';
import {
  useCashClosing,
  useCreateExpense,
  useDeleteExpense,
  useDreReport,
  useExpenses,
  useFinancialDashboard,
  useUpdateExpense,
} from '../../hooks/useFinance';
import { useRestaurantSettings, useUpdateRestaurantSettings } from '../../hooks/useSettings';
import { formatCurrency, parsePriceInput } from '../../lib/utils';
import { cn } from '../../lib/cn';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input, Label, Select } from '../ui/Input';

type TabId = 'dashboard' | 'dre' | 'expenses' | 'cash' | 'settings';

const TABS: Array<{ id: TabId; label: string; icon: typeof BarChart3 }> = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'dre', label: 'DRE', icon: FileText },
  { id: 'expenses', label: 'Despesas', icon: Receipt },
  { id: 'cash', label: 'Fechamento', icon: Wallet },
  { id: 'settings', label: 'Pagamentos', icon: Settings2 },
];

function getDefaultPeriod() {
  const to = new Date();
  const from = new Date(to.getFullYear(), to.getMonth(), 1);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

export function FinanceiroTab() {
  const defaults = useMemo(() => getDefaultPeriod(), []);
  const [tab, setTab] = useState<TabId>('dashboard');
  const [from, setFrom] = useState(defaults.from);
  const [to, setTo] = useState(defaults.to);
  const [closingDate, setClosingDate] = useState(getToday());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Financeiro</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Receita, DRE simplificado, despesas operacionais, fechamento de caixa e formas de pagamento.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((entry) => {
          const Icon = entry.icon;
          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => setTab(entry.id)}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition',
                tab === entry.id
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300',
              )}
            >
              <Icon className="h-4 w-4" />
              {entry.label}
            </button>
          );
        })}
      </div>

      {(tab === 'dashboard' || tab === 'dre' || tab === 'expenses') && (
        <PeriodFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo} />
      )}

      {tab === 'cash' && (
        <Card className="p-4">
          <Label htmlFor="closing-date">Data do fechamento</Label>
          <Input
            id="closing-date"
            type="date"
            value={closingDate}
            onChange={(event) => setClosingDate(event.target.value)}
            className="mt-2 max-w-xs"
          />
        </Card>
      )}

      {tab === 'dashboard' && <DashboardSection from={from} to={to} />}
      {tab === 'dre' && <DreSection from={from} to={to} />}
      {tab === 'expenses' && <ExpensesSection from={from} to={to} />}
      {tab === 'cash' && <CashClosingSection date={closingDate} />}
      {tab === 'settings' && <PaymentSettingsSection />}
    </div>
  );
}

function PeriodFilter({
  from,
  to,
  onFromChange,
  onToChange,
}: {
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
}) {
  return (
    <Card className="flex flex-wrap items-end gap-4 p-4">
      <div>
        <Label htmlFor="period-from">De</Label>
        <Input
          id="period-from"
          type="date"
          value={from}
          onChange={(event) => onFromChange(event.target.value)}
          className="mt-2"
        />
      </div>
      <div>
        <Label htmlFor="period-to">Até</Label>
        <Input
          id="period-to"
          type="date"
          value={to}
          onChange={(event) => onToChange(event.target.value)}
          className="mt-2"
        />
      </div>
    </Card>
  );
}

function DashboardSection({ from, to }: { from: string; to: string }) {
  const { data, isLoading } = useFinancialDashboard(from, to);

  if (isLoading || !data) {
    return <p className="text-sm text-zinc-500">Carregando dashboard...</p>;
  }

  const maxDailyRevenue = Math.max(...data.dailySales.map((entry) => entry.revenue), 1);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Receita" value={formatCurrency(data.revenue)} icon={Banknote} />
        <MetricCard
          label="Pedidos"
          value={String(data.ordersCount)}
          hint={`Ticket médio: ${formatCurrency(data.averageTicket)}`}
          icon={Receipt}
        />
        <MetricCard
          label="Margem bruta"
          value={`${data.grossMarginPercent.toFixed(1)}%`}
          hint={formatCurrency(data.grossProfit)}
          icon={BarChart3}
        />
        <MetricCard
          label="Lucro líquido"
          value={formatCurrency(data.netProfit)}
          hint={`Margem: ${data.netMarginPercent.toFixed(1)}%`}
          icon={Wallet}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Vendas por canal</h3>
          <div className="mt-4 space-y-3">
            {data.salesByChannel.map((entry) => (
              <div key={entry.channel} className="flex items-center justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">
                  {MENU_CHANNEL_LABELS[entry.channel]}
                </span>
                <div className="text-right">
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">
                    {formatCurrency(entry.revenue)}
                  </p>
                  <p className="text-xs text-zinc-500">{entry.ordersCount} pedidos</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Formas de pagamento</h3>
          <div className="mt-4 space-y-3">
            {data.salesByPayment.length === 0 ? (
              <p className="text-sm text-zinc-500">Nenhuma venda no período.</p>
            ) : (
              data.salesByPayment.map((entry) => (
                <div key={entry.method} className="flex items-center justify-between text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">{entry.label}</span>
                  <div className="text-right">
                    <p className="font-medium text-zinc-900 dark:text-zinc-50">
                      {formatCurrency(entry.revenue)}
                    </p>
                    <p className="text-xs text-zinc-500">{entry.ordersCount} pedidos</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Receita diária</h3>
        {data.dailySales.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">Nenhuma venda no período.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {data.dailySales.map((entry) => (
              <div key={entry.date} className="flex items-center gap-3 text-sm">
                <span className="w-24 shrink-0 text-zinc-500">
                  {new Date(`${entry.date}T12:00:00`).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                  })}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-brand-500"
                    style={{ width: `${(entry.revenue / maxDailyRevenue) * 100}%` }}
                  />
                </div>
                <span className="w-28 shrink-0 text-right font-medium text-zinc-900 dark:text-zinc-50">
                  {formatCurrency(entry.revenue)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="CMV teórico" value={formatCurrency(data.theoreticalCmv)} />
        <MetricCard label="Despesas no período" value={formatCurrency(data.expensesTotal)} />
        <MetricCard
          label="Cancelados"
          value={String(data.cancelledOrders)}
          hint="Pedidos cancelados no período"
        />
      </div>
    </div>
  );
}

function DreSection({ from, to }: { from: string; to: string }) {
  const { data, isLoading } = useDreReport(from, to);

  if (isLoading || !data) {
    return <p className="text-sm text-zinc-500">Carregando DRE...</p>;
  }

  const lines = [
    { label: 'Receita bruta', value: data.grossRevenue, highlight: false },
    { label: '(−) CMV teórico', value: -data.theoreticalCmv, highlight: false },
    { label: '= Lucro bruto', value: data.grossProfit, highlight: true },
    { label: '(−) Despesas operacionais', value: -data.operatingExpenses, highlight: false },
    { label: '= Lucro líquido', value: data.netProfit, highlight: true },
  ];

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
          Demonstrativo de resultados
        </h3>
        <p className="mt-1 text-sm text-zinc-500">
          Período: {data.period.from} a {data.period.to}
        </p>

        <div className="mt-5 space-y-3">
          {lines.map((line) => (
            <div
              key={line.label}
              className={cn(
                'flex items-center justify-between border-b border-zinc-100 py-2 text-sm dark:border-zinc-800',
                line.highlight && 'font-semibold',
              )}
            >
              <span className="text-zinc-700 dark:text-zinc-300">{line.label}</span>
              <span
                className={cn(
                  line.value < 0 ? 'text-red-600 dark:text-red-400' : 'text-zinc-900 dark:text-zinc-50',
                )}
              >
                {formatCurrency(Math.abs(line.value))}
                {line.value < 0 ? '' : ''}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-zinc-50 p-3 text-sm dark:bg-zinc-900/50">
            <p className="text-zinc-500">Margem bruta</p>
            <p className="mt-1 font-semibold text-zinc-900 dark:text-zinc-50">
              {data.grossMarginPercent.toFixed(1)}%
            </p>
          </div>
          <div className="rounded-lg bg-zinc-50 p-3 text-sm dark:bg-zinc-900/50">
            <p className="text-zinc-500">Margem líquida</p>
            <p className="mt-1 font-semibold text-zinc-900 dark:text-zinc-50">
              {data.netMarginPercent.toFixed(1)}%
            </p>
          </div>
        </div>
      </Card>

      {data.expensesByCategory.length > 0 && (
        <Card className="p-5">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Despesas por categoria</h3>
          <div className="mt-4 space-y-2">
            {data.expensesByCategory.map((entry) => (
              <div key={entry.category} className="flex justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">{entry.label}</span>
                <span className="font-medium">{formatCurrency(entry.amount)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {data.realCmv !== null && (
        <Card className="p-5">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">CMV real (estoque)</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div>
              <p className="text-xs text-zinc-500">CMV teórico</p>
              <p className="font-medium">{formatCurrency(data.theoreticalCmv)}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">CMV real</p>
              <p className="font-medium">{formatCurrency(data.realCmv)}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Variação</p>
              <p className="font-medium">
                {data.cmvVariance !== null ? formatCurrency(data.cmvVariance) : '—'}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function ExpensesSection({ from, to }: { from: string; to: string }) {
  const { data: expenses = [], isLoading } = useExpenses(from, to);
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();

  const [category, setCategory] = useState<ExpenseCategory>(ExpenseCategory.OTHER);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(getToday());
  const [paid, setPaid] = useState(false);

  const handleCreate = async () => {
    const parsedAmount = parsePriceInput(amount);
    if (!description.trim() || Number.isNaN(parsedAmount) || parsedAmount <= 0) return;

    await createExpense.mutateAsync({
      category,
      description: description.trim(),
      amount: parsedAmount,
      dueDate,
      paid,
    });

    setDescription('');
    setAmount('');
    setPaid(false);
  };

  if (isLoading) {
    return <p className="text-sm text-zinc-500">Carregando despesas...</p>;
  }

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Nova despesa</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label>Categoria</Label>
            <Select
              value={category}
              onChange={(event) => setCategory(event.target.value as ExpenseCategory)}
              className="mt-2"
            >
              {Object.values(ExpenseCategory).map((value) => (
                <option key={value} value={value}>
                  {EXPENSE_CATEGORY_LABELS[value]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Descrição</Label>
            <Input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Ex: Conta de luz"
              className="mt-2"
            />
          </div>
          <div>
            <Label>Valor (R$)</Label>
            <Input
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0,00"
              className="mt-2"
            />
          </div>
          <div>
            <Label>Vencimento</Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              className="mt-2"
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <input
              type="checkbox"
              checked={paid}
              onChange={(event) => setPaid(event.target.checked)}
              className="rounded border-zinc-300"
            />
            Já pago
          </label>
          <Button onClick={handleCreate} disabled={createExpense.isPending}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar despesa
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-zinc-200 px-5 py-3 dark:border-zinc-800">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Contas do período</h3>
        </div>
        {expenses.length === 0 ? (
          <p className="p-5 text-sm text-zinc-500">Nenhuma despesa cadastrada neste período.</p>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-zinc-900 dark:text-zinc-50">
                      {expense.description}
                    </p>
                    <Badge variant="muted">{EXPENSE_CATEGORY_LABELS[expense.category]}</Badge>
                    {expense.paidAt ? (
                      <Badge variant="success">Pago</Badge>
                    ) : (
                      <Badge variant="warning">Pendente</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-zinc-500">
                    Vencimento: {new Date(`${expense.dueDate}T12:00:00`).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                    {formatCurrency(expense.amount)}
                  </span>
                  {!expense.paidAt && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={updateExpense.isPending}
                      onClick={() => updateExpense.mutate({ id: expense.id, paid: true })}
                    >
                      Marcar pago
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={deleteExpense.isPending}
                    onClick={() => deleteExpense.mutate(expense.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function CashClosingSection({ date }: { date: string }) {
  const { data, isLoading } = useCashClosing(date);

  if (isLoading || !data) {
    return <p className="text-sm text-zinc-500">Carregando fechamento...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Receita do dia" value={formatCurrency(data.revenue)} icon={Banknote} />
        <MetricCard
          label="Pedidos"
          value={String(data.ordersCount)}
          hint={`Ticket: ${formatCurrency(data.averageTicket)}`}
        />
        <MetricCard label="Despesas pagas" value={formatCurrency(data.expensesPaid)} />
        <MetricCard
          label="Fluxo líquido"
          value={formatCurrency(data.netCashFlow)}
          hint="Receita − despesas pagas no dia"
          icon={Wallet}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Por forma de pagamento</h3>
          <div className="mt-4 space-y-2 text-sm">
            <Row label="Pix" value={formatCurrency(data.pixTotal)} />
            <Row label="Cartão / wallets" value={formatCurrency(data.cardTotal)} />
            <Row label="Comanda / outros" value={formatCurrency(data.otherPaymentsTotal)} />
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Por canal</h3>
          <div className="mt-4 space-y-2 text-sm">
            <Row label="Salão / QR" value={formatCurrency(data.tableRevenue)} />
            <Row label="Delivery" value={formatCurrency(data.deliveryRevenue)} />
          </div>
        </Card>
      </div>
    </div>
  );
}

function PaymentSettingsSection() {
  const { data: settings, isLoading } = useRestaurantSettings();
  const updateSettings = useUpdateRestaurantSettings();

  if (isLoading || !settings) {
    return <p className="text-sm text-zinc-500">Carregando configurações...</p>;
  }

  const modes = [PaymentMode.PAY_AFTER, PaymentMode.PAY_BEFORE] as const;

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">Modo de pagamento</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Escolha quando o cliente paga pelo pedido.
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
                className={cn(
                  'rounded-xl border p-4 text-left transition',
                  selected
                    ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500/20 dark:border-brand-500 dark:bg-brand-950/50'
                    : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900/40',
                  updateSettings.isPending && 'opacity-60',
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      'mt-0.5 rounded-lg p-2',
                      selected
                        ? 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300'
                        : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-50">
                      {PAYMENT_MODE_LABELS[mode]}
                    </p>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      {mode === PaymentMode.PAY_BEFORE
                        ? 'Cliente paga via Pix, cartão ou wallets antes da cozinha.'
                        : 'Comanda aberta — pagamento no fechamento da conta.'}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {settings.paymentMode === PaymentMode.PAY_BEFORE && (
        <Card className="p-5">
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">Formas de pagamento</h2>
          <ul className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
            <li>• Pix (Mercado Pago)</li>
            <li>• Cartão de crédito/débito (Stripe)</li>
            <li>• Apple Pay e Google Pay (via Stripe)</li>
          </ul>
        </Card>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: typeof Banknote;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-2">
        {Icon && <Icon className="mt-0.5 h-4 w-4 text-brand-600" />}
        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
          <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">{value}</p>
          {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
        </div>
      </div>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-zinc-600 dark:text-zinc-400">{label}</span>
      <span className="font-medium text-zinc-900 dark:text-zinc-50">{value}</span>
    </div>
  );
}
