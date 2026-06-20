import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import {
  MenuChannel,
  OrderStatus,
  PaymentStatus,
  ReportsDashboardDto,
} from '@pedidonamesa/shared';
import { Order } from '../entities';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepo: Repository<Order>,
  ) {}

  private resolvePeriod(from?: string, to?: string) {
    const periodTo = to ? new Date(to) : new Date();
    periodTo.setHours(23, 59, 59, 999);

    const periodFrom = from
      ? new Date(from)
      : new Date(periodTo.getFullYear(), periodTo.getMonth(), 1);
    periodFrom.setHours(0, 0, 0, 0);

    return { periodFrom, periodTo };
  }

  private isRevenueOrder(order: Order): boolean {
    if (order.status === OrderStatus.CANCELLED) return false;
    if (order.paymentStatus === PaymentStatus.PENDING) return false;
    if (order.paymentStatus === PaymentStatus.FAILED) return false;
    return true;
  }

  async getDashboard(
    restaurantId: string,
    from?: string,
    to?: string,
  ): Promise<ReportsDashboardDto> {
    const { periodFrom, periodTo } = this.resolvePeriod(from, to);

    const orders = await this.ordersRepo.find({
      where: {
        restaurantId,
        createdAt: Between(periodFrom, periodTo),
      },
      relations: ['items', 'table'],
      order: { createdAt: 'ASC' },
    });

    const revenueOrders = orders.filter((order) => this.isRevenueOrder(order));
    const cancelledOrders = orders.filter((order) => order.status === OrderStatus.CANCELLED);

    const revenue = revenueOrders.reduce((sum, order) => sum + Number(order.total), 0);
    const ordersCount = revenueOrders.length;
    const averageTicket = ordersCount > 0 ? revenue / ordersCount : 0;
    const itemsSold = revenueOrders.reduce(
      (sum, order) =>
        sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
      0,
    );

    const channelMap = new Map<MenuChannel, { ordersCount: number; revenue: number }>();
    for (const channel of Object.values(MenuChannel)) {
      channelMap.set(channel, { ordersCount: 0, revenue: 0 });
    }
    for (const order of revenueOrders) {
      const entry = channelMap.get(order.channel)!;
      entry.ordersCount += 1;
      entry.revenue += Number(order.total);
    }
    const salesByChannel = Array.from(channelMap.entries()).map(([channel, stats]) => ({
      channel,
      ordersCount: stats.ordersCount,
      revenue: stats.revenue,
      averageTicket: stats.ordersCount > 0 ? stats.revenue / stats.ordersCount : 0,
    }));

    const dailyMap = new Map<string, { revenue: number; ordersCount: number }>();
    for (const order of revenueOrders) {
      const date = order.createdAt.toISOString().slice(0, 10);
      const entry = dailyMap.get(date) ?? { revenue: 0, ordersCount: 0 };
      entry.revenue += Number(order.total);
      entry.ordersCount += 1;
      dailyMap.set(date, entry);
    }
    const dailySales = Array.from(dailyMap.entries())
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const tableMap = new Map<
      string,
      {
        tableNumber: number;
        tableLabel: string | null;
        revenue: number;
        ordersCount: number;
        itemsSold: number;
        timestamps: Date[];
      }
    >();

    for (const order of revenueOrders) {
      if (order.channel !== MenuChannel.TABLE || !order.tableId || !order.table) continue;

      const entry = tableMap.get(order.tableId) ?? {
        tableNumber: order.table.number,
        tableLabel: order.table.label,
        revenue: 0,
        ordersCount: 0,
        itemsSold: 0,
        timestamps: [],
      };
      entry.revenue += Number(order.total);
      entry.ordersCount += 1;
      entry.itemsSold += order.items.reduce((sum, item) => sum + item.quantity, 0);
      entry.timestamps.push(order.createdAt);
      tableMap.set(order.tableId, entry);
    }

    const tablePerformance = Array.from(tableMap.entries())
      .map(([tableId, stats]) => {
        let averageStayMinutes: number | null = null;
        if (stats.timestamps.length > 1) {
          const sorted = [...stats.timestamps].sort((a, b) => a.getTime() - b.getTime());
          const spanMs = sorted[sorted.length - 1].getTime() - sorted[0].getTime();
          averageStayMinutes = Math.round(spanMs / 60000);
        }

        return {
          tableId,
          tableNumber: stats.tableNumber,
          tableLabel: stats.tableLabel,
          revenue: stats.revenue,
          ordersCount: stats.ordersCount,
          itemsSold: stats.itemsSold,
          averageTicket: stats.ordersCount > 0 ? stats.revenue / stats.ordersCount : 0,
          averageStayMinutes,
        };
      })
      .sort((a, b) => b.revenue - a.revenue);

    const productMap = new Map<
      string,
      { productName: string; quantitySold: number; revenue: number }
    >();
    for (const order of revenueOrders) {
      for (const item of order.items) {
        const entry = productMap.get(item.productId) ?? {
          productName: item.productName,
          quantitySold: 0,
          revenue: 0,
        };
        entry.quantitySold += item.quantity;
        entry.revenue += Number(item.unitPrice) * item.quantity;
        productMap.set(item.productId, entry);
      }
    }
    const productOutput = Array.from(productMap.entries())
      .map(([productId, stats]) => ({
        productId,
        productName: stats.productName,
        quantitySold: stats.quantitySold,
        revenue: stats.revenue,
      }))
      .sort((a, b) => b.quantitySold - a.quantitySold);

    return {
      period: {
        from: periodFrom.toISOString().slice(0, 10),
        to: periodTo.toISOString().slice(0, 10),
      },
      revenue,
      ordersCount,
      cancelledOrders: cancelledOrders.length,
      averageTicket,
      itemsSold,
      salesByChannel,
      dailySales,
      tablePerformance,
      productOutput,
    };
  }
}
