import { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Download,
  Printer,
  TrendingUp,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts';
import { MENU_CHANNEL_LABELS, MenuChannel } from '@pedidonamesa/shared';
import { useReportsDashboard } from '../../hooks/useReports';
import { useRestaurantSettings } from '../../hooks/useSettings';
import { formatCurrency } from '../../lib/utils';
import { cn } from '../../lib/cn';
import { Badge } from '../shadcn/badge';
import { Button } from '../shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../shadcn/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '../shadcn/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../shadcn/select';
import { Skeleton } from '../shadcn/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../shadcn/tabs';

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

const revenueChartConfig = {
  revenue: { label: 'Faturamento', color: 'hsl(var(--chart-1))' },
} satisfies ChartConfig;

const ordersChartConfig = {
  ordersCount: { label: 'Pedidos', color: 'hsl(var(--chart-3))' },
} satisfies ChartConfig;

const itemsChartConfig = {
  itemsSold: { label: 'Itens', color: 'hsl(var(--chart-2))' },
} satisfies ChartConfig;

const dailyChartConfig = {
  revenue: { label: 'Faturamento', color: 'hsl(var(--chart-1))' },
} satisfies ChartConfig;

const productChartConfig = {
  quantitySold: { label: 'Quantidade', color: 'hsl(var(--chart-1))' },
} satisfies ChartConfig;

function getDefaultPeriod() {
  const to = new Date();
  const from = new Date(to.getFullYear(), to.getMonth(), 1);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

function formatStayTime(minutes: number | null) {
  if (minutes === null) return '—';
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h${mins.toString().padStart(2, '0')}` : `${hours}h`;
}

function tableLabel(tableNumber: number, tableLabel: string | null) {
  return tableLabel ? `${tableLabel}` : `Mesa ${tableNumber}`;
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
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">De</label>
        <input
          type="date"
          value={from}
          onChange={(e) => onFromChange(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Até</label>
        <input
          type="date"
          value={to}
          onChange={(e) => onToChange(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        />
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  loading,
}: {
  title: string;
  value: string;
  subtitle?: string;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <MetricCard key={i} title="" value="" loading />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  );
}

export function DashboardTab() {
  const defaults = useMemo(() => getDefaultPeriod(), []);
  const [from, setFrom] = useState(defaults.from);
  const [to, setTo] = useState(defaults.to);
  const [tableFilter, setTableFilter] = useState('all');
  const { data: settings } = useRestaurantSettings();
  const { data, isLoading } = useReportsDashboard(from, to);

  const filteredTables = useMemo(() => {
    if (!data) return [];
    if (tableFilter === 'all') return data.tablePerformance;
    return data.tablePerformance.filter((t) => t.tableId === tableFilter);
  }, [data, tableFilter]);

  const tableRevenueData = useMemo(
    () =>
      filteredTables.slice(0, 8).map((t) => ({
        name: tableLabel(t.tableNumber, t.tableLabel),
        revenue: t.revenue,
      })),
    [filteredTables],
  );

  const tableItemsData = useMemo(
    () =>
      filteredTables.slice(0, 8).map((t, i) => ({
        name: tableLabel(t.tableNumber, t.tableLabel),
        itemsSold: t.itemsSold,
        fill: CHART_COLORS[i % CHART_COLORS.length],
      })),
    [filteredTables],
  );

  const tableOrdersData = useMemo(
    () =>
      filteredTables.slice(0, 8).map((t) => ({
        name: tableLabel(t.tableNumber, t.tableLabel),
        ordersCount: t.ordersCount,
      })),
    [filteredTables],
  );

  const dailyData = useMemo(
    () =>
      data?.dailySales.map((d) => ({
        date: new Date(d.date + 'T12:00:00').toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
        }),
        revenue: d.revenue,
        ordersCount: d.ordersCount,
      })) ?? [],
    [data],
  );

  const productData = useMemo(
    () =>
      data?.productOutput.slice(0, 10).map((p, i) => ({
        name: p.productName.length > 20 ? p.productName.slice(0, 20) + '…' : p.productName,
        fullName: p.productName,
        quantitySold: p.quantitySold,
        revenue: p.revenue,
        fill: CHART_COLORS[i % CHART_COLORS.length],
      })) ?? [],
    [data],
  );

  const avgTurnover =
    filteredTables.length > 0
      ? filteredTables.reduce((sum, t) => sum + t.ordersCount, 0) / filteredTables.length
      : 0;

  const avgStay =
    filteredTables.filter((t) => t.averageStayMinutes !== null).length > 0
      ? filteredTables
          .filter((t) => t.averageStayMinutes !== null)
          .reduce((sum, t) => sum + (t.averageStayMinutes ?? 0), 0) /
        filteredTables.filter((t) => t.averageStayMinutes !== null).length
      : null;

  const channelData =
    data?.salesByChannel.filter((c) => c.ordersCount > 0) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Relatórios
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhe o desempenho das mesas e potencialize a gestão do seu restaurante.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" title="Imprimir">
            <Printer className="h-4 w-4" />
          </Button>
          <Button>
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      <PeriodFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo} />

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">Relatório geral</TabsTrigger>
          <TabsTrigger value="products">Saída de produtos</TabsTrigger>
          <TabsTrigger value="tables">Performance das mesas</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          {isLoading ? (
            <DashboardSkeleton />
          ) : data ? (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard title="Faturamento total" value={formatCurrency(data.revenue)} />
                <MetricCard
                  title="Pedidos"
                  value={data.ordersCount.toLocaleString('pt-BR')}
                  subtitle={`${data.cancelledOrders} cancelados`}
                />
                <MetricCard
                  title="Ticket médio"
                  value={formatCurrency(data.averageTicket)}
                />
                <MetricCard
                  title="Itens vendidos"
                  value={data.itemsSold.toLocaleString('pt-BR')}
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Vendas por dia</CardTitle>
                    <CardDescription>Faturamento no período selecionado</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {dailyData.length === 0 ? (
                      <p className="py-12 text-center text-sm text-muted-foreground">
                        Sem vendas no período
                      </p>
                    ) : (
                      <ChartContainer config={dailyChartConfig} className="h-64 w-full">
                        <BarChart data={dailyData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                          <CartesianGrid vertical={false} strokeDasharray="3 3" />
                          <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={12} />
                          <YAxis
                            tickLine={false}
                            axisLine={false}
                            fontSize={12}
                            tickFormatter={(v) =>
                              v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`
                            }
                          />
                          <ChartTooltip
                            content={
                              <ChartTooltipContent
                                formatter={(value) => formatCurrency(Number(value))}
                              />
                            }
                          />
                          <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ChartContainer>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Vendas por canal</CardTitle>
                    <CardDescription>Mesa vs delivery</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {channelData.length === 0 ? (
                      <p className="py-12 text-center text-sm text-muted-foreground">
                        Sem vendas no período
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {channelData.map((channel, i) => (
                          <div key={channel.channel} className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium">
                                {MENU_CHANNEL_LABELS[channel.channel as MenuChannel]}
                              </span>
                              <span className="text-muted-foreground">
                                {formatCurrency(channel.revenue)}
                              </span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${data.revenue > 0 ? (channel.revenue / data.revenue) * 100 : 0}%`,
                                  backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                                }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {channel.ordersCount} pedidos · ticket{' '}
                              {formatCurrency(channel.averageTicket)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="products">
          {isLoading ? (
            <DashboardSkeleton />
          ) : data ? (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <MetricCard
                  title="Produtos vendidos"
                  value={data.productOutput.length.toLocaleString('pt-BR')}
                  subtitle="Produtos distintos no período"
                />
                <MetricCard
                  title="Total de itens"
                  value={data.itemsSold.toLocaleString('pt-BR')}
                />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Top produtos por quantidade</CardTitle>
                  <CardDescription>Saída de produtos no período</CardDescription>
                </CardHeader>
                <CardContent>
                  {productData.length === 0 ? (
                    <p className="py-12 text-center text-sm text-muted-foreground">
                      Sem produtos vendidos no período
                    </p>
                  ) : (
                    <ChartContainer config={productChartConfig} className="h-80 w-full">
                      <BarChart
                        data={productData}
                        layout="vertical"
                        margin={{ top: 8, right: 24, left: 8, bottom: 0 }}
                      >
                        <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                        <XAxis type="number" tickLine={false} axisLine={false} fontSize={12} />
                        <YAxis
                          type="category"
                          dataKey="name"
                          tickLine={false}
                          axisLine={false}
                          width={120}
                          fontSize={12}
                        />
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              formatter={(value, _name, item) => {
                                const payload = item.payload as { fullName: string; revenue: number };
                                return [
                                  `${Number(value).toLocaleString('pt-BR')} un · ${formatCurrency(payload.revenue)}`,
                                  payload.fullName,
                                ];
                              }}
                            />
                          }
                        />
                        <Bar dataKey="quantitySold" radius={[0, 4, 4, 0]}>
                          {productData.map((entry, index) => (
                            <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Detalhamento</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-muted-foreground">
                          <th className="px-6 py-3 font-medium">Produto</th>
                          <th className="px-6 py-3 font-medium">Qtd</th>
                          <th className="px-6 py-3 font-medium">Faturamento</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.productOutput.slice(0, 15).map((product) => (
                          <tr key={product.productId} className="border-b last:border-0">
                            <td className="px-6 py-3">{product.productName}</td>
                            <td className="px-6 py-3">{product.quantitySold}</td>
                            <td className="px-6 py-3">{formatCurrency(product.revenue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="tables">
          {isLoading ? (
            <DashboardSkeleton />
          ) : data ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <Select value={tableFilter} onValueChange={setTableFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Todas as mesas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as mesas</SelectItem>
                    {data.tablePerformance.map((table) => (
                      <SelectItem key={table.tableId} value={table.tableId}>
                        {tableLabel(table.tableNumber, table.tableLabel)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader className="flex flex-row items-start justify-between space-y-0">
                    <div>
                      <CardDescription>Faturamento total</CardDescription>
                      <CardTitle className="text-2xl">
                        {formatCurrency(filteredTables.reduce((s, t) => s + t.revenue, 0))}
                      </CardTitle>
                    </div>
                    <Badge variant="success" className="gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {settings?.name ?? 'Período'}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    {tableRevenueData.length === 0 ? (
                      <p className="py-12 text-center text-sm text-muted-foreground">
                        Sem vendas em mesas no período
                      </p>
                    ) : (
                      <ChartContainer config={revenueChartConfig} className="h-56 w-full">
                        <BarChart
                          data={tableRevenueData}
                          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid vertical={false} strokeDasharray="3 3" />
                          <XAxis
                            dataKey="name"
                            tickLine={false}
                            axisLine={false}
                            fontSize={11}
                            interval={0}
                            angle={-20}
                            textAnchor="end"
                            height={50}
                          />
                          <YAxis
                            tickLine={false}
                            axisLine={false}
                            fontSize={12}
                            tickFormatter={(v) =>
                              v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`
                            }
                          />
                          <ChartTooltip
                            content={
                              <ChartTooltipContent
                                formatter={(value) => formatCurrency(Number(value))}
                              />
                            }
                          />
                          <Bar
                            dataKey="revenue"
                            fill="var(--color-revenue)"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ChartContainer>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-start justify-between space-y-0">
                    <div>
                      <CardDescription>Itens atendidos</CardDescription>
                      <CardTitle className="text-2xl">
                        {filteredTables
                          .reduce((s, t) => s + t.itemsSold, 0)
                          .toLocaleString('pt-BR')}
                      </CardTitle>
                    </div>
                    <Badge variant="success" className="gap-1">
                      <ArrowUp className="h-3 w-3" />
                      por mesa
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    {tableItemsData.length === 0 ? (
                      <p className="py-12 text-center text-sm text-muted-foreground">
                        Sem dados
                      </p>
                    ) : (
                      <ChartContainer config={itemsChartConfig} className="h-56 w-full">
                        <BarChart
                          data={tableItemsData}
                          layout="vertical"
                          margin={{ top: 8, right: 24, left: 8, bottom: 0 }}
                        >
                          <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                          <XAxis type="number" tickLine={false} axisLine={false} fontSize={12} />
                          <YAxis
                            type="category"
                            dataKey="name"
                            tickLine={false}
                            axisLine={false}
                            width={80}
                            fontSize={12}
                          />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="itemsSold" radius={[0, 4, 4, 0]}>
                            {tableItemsData.map((entry, index) => (
                              <Cell
                                key={entry.name}
                                fill={CHART_COLORS[index % CHART_COLORS.length]}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ChartContainer>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-start justify-between space-y-0">
                    <div>
                      <CardDescription>Média de giros</CardDescription>
                      <CardTitle className="text-2xl">
                        {avgTurnover.toFixed(1)}
                      </CardTitle>
                    </div>
                    <Badge variant="success" className="gap-1">
                      <ArrowUp className="h-3 w-3" />
                      pedidos/mesa
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    {tableOrdersData.length === 0 ? (
                      <p className="py-12 text-center text-sm text-muted-foreground">
                        Sem dados
                      </p>
                    ) : (
                      <ChartContainer config={ordersChartConfig} className="h-56 w-full">
                        <BarChart
                          data={tableOrdersData}
                          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid vertical={false} strokeDasharray="3 3" />
                          <XAxis
                            dataKey="name"
                            tickLine={false}
                            axisLine={false}
                            fontSize={11}
                            interval={0}
                            angle={-20}
                            textAnchor="end"
                            height={50}
                          />
                          <YAxis tickLine={false} axisLine={false} fontSize={12} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar
                            dataKey="ordersCount"
                            fill="var(--color-ordersCount)"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ChartContainer>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-start justify-between space-y-0">
                    <div>
                      <CardDescription>Tempo médio de permanência</CardDescription>
                      <CardTitle className="text-2xl">{formatStayTime(avgStay ? Math.round(avgStay) : null)}</CardTitle>
                    </div>
                    {avgStay !== null && (
                      <Badge variant="success" className="gap-1">
                        <ArrowDown className="h-3 w-3" />
                        estimado
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent>
                    {filteredTables.length === 0 ? (
                      <p className="py-12 text-center text-sm text-muted-foreground">
                        Sem dados de permanência
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {filteredTables.slice(0, 6).map((table) => (
                          <div
                            key={table.tableId}
                            className="flex items-center justify-between rounded-lg border px-4 py-3"
                          >
                            <span className="text-sm font-medium">
                              {tableLabel(table.tableNumber, table.tableLabel)}
                            </span>
                            <span
                              className={cn(
                                'text-sm tabular-nums',
                                table.averageStayMinutes !== null
                                  ? 'text-foreground'
                                  : 'text-muted-foreground',
                              )}
                            >
                              {formatStayTime(table.averageStayMinutes)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}
