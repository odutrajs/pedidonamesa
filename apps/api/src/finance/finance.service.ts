import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import {
  CashClosingDto,
  DreReportDto,
  EXPENSE_CATEGORY_LABELS,
  ExpenseCategory,
  ExpenseDto,
  FinancialDashboardDto,
  MenuChannel,
  OrderStatus,
  PaymentMethod,
  PAYMENT_METHOD_LABELS,
  PaymentStatus,
} from '@pedidonamesa/shared';
import { Expense, Order } from '../entities';
import { InventoryService } from '../inventory/inventory.service';
import { CreateExpenseDto, UpdateExpenseDto } from './dto/finance.dto';

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepo: Repository<Order>,
    @InjectRepository(Expense)
    private readonly expensesRepo: Repository<Expense>,
    private readonly inventoryService: InventoryService,
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

  private async loadOrdersInPeriod(restaurantId: string, periodFrom: Date, periodTo: Date) {
    return this.ordersRepo.find({
      where: {
        restaurantId,
        createdAt: Between(periodFrom, periodTo),
      },
      order: { createdAt: 'ASC' },
    });
  }

  async getDashboard(
    restaurantId: string,
    from?: string,
    to?: string,
  ): Promise<FinancialDashboardDto> {
    const { periodFrom, periodTo } = this.resolvePeriod(from, to);
    const orders = await this.loadOrdersInPeriod(restaurantId, periodFrom, periodTo);
    const revenueOrders = orders.filter((order) => this.isRevenueOrder(order));
    const cancelledOrders = orders.filter((order) => order.status === OrderStatus.CANCELLED);

    const revenue = revenueOrders.reduce((sum, order) => sum + Number(order.total), 0);
    const ordersCount = revenueOrders.length;
    const averageTicket = ordersCount > 0 ? revenue / ordersCount : 0;

    const cmvReport = await this.inventoryService.getCmvReport(
      restaurantId,
      periodFrom.toISOString().slice(0, 10),
      periodTo.toISOString().slice(0, 10),
    );
    const theoreticalCmv = cmvReport.theoreticalCmv;
    const grossProfit = revenue - theoreticalCmv;
    const grossMarginPercent = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

    const expenses = await this.expensesRepo.find({
      where: {
        restaurantId,
        dueDate: Between(
          periodFrom.toISOString().slice(0, 10),
          periodTo.toISOString().slice(0, 10),
        ),
      },
    });
    const expensesTotal = expenses.reduce((sum, entry) => sum + Number(entry.amount), 0);
    const expensesPaid = expenses
      .filter((entry) => entry.paidAt !== null)
      .reduce((sum, entry) => sum + Number(entry.amount), 0);
    const netProfit = grossProfit - expensesTotal;
    const netMarginPercent = revenue > 0 ? (netProfit / revenue) * 100 : 0;

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

    const paymentMap = new Map<
      PaymentMethod | 'UNKNOWN',
      { ordersCount: number; revenue: number }
    >();
    for (const order of revenueOrders) {
      const key = order.paymentMethod ?? 'UNKNOWN';
      const entry = paymentMap.get(key) ?? { ordersCount: 0, revenue: 0 };
      entry.ordersCount += 1;
      entry.revenue += Number(order.total);
      paymentMap.set(key, entry);
    }
    const salesByPayment = Array.from(paymentMap.entries()).map(([method, stats]) => ({
      method,
      label:
        method === 'UNKNOWN'
          ? 'Não informado / comanda'
          : PAYMENT_METHOD_LABELS[method as PaymentMethod],
      ordersCount: stats.ordersCount,
      revenue: stats.revenue,
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

    return {
      period: {
        from: periodFrom.toISOString().slice(0, 10),
        to: periodTo.toISOString().slice(0, 10),
      },
      revenue,
      ordersCount,
      cancelledOrders: cancelledOrders.length,
      averageTicket,
      theoreticalCmv,
      grossProfit,
      grossMarginPercent,
      expensesTotal,
      expensesPaid,
      netProfit,
      netMarginPercent,
      salesByChannel,
      salesByPayment,
      dailySales,
    };
  }

  async getDreReport(restaurantId: string, from?: string, to?: string): Promise<DreReportDto> {
    const { periodFrom, periodTo } = this.resolvePeriod(from, to);
    const orders = await this.loadOrdersInPeriod(restaurantId, periodFrom, periodTo);
    const revenueOrders = orders.filter((order) => this.isRevenueOrder(order));
    const cancelledOrders = orders.filter((order) => order.status === OrderStatus.CANCELLED);

    const grossRevenue = revenueOrders.reduce((sum, order) => sum + Number(order.total), 0);
    const cancelledOrdersValue = cancelledOrders.reduce(
      (sum, order) => sum + Number(order.total),
      0,
    );

    const cmvReport = await this.inventoryService.getCmvReport(
      restaurantId,
      periodFrom.toISOString().slice(0, 10),
      periodTo.toISOString().slice(0, 10),
    );

    const grossProfit = grossRevenue - cmvReport.theoreticalCmv;
    const grossMarginPercent =
      grossRevenue > 0 ? (grossProfit / grossRevenue) * 100 : 0;

    const expenses = await this.expensesRepo.find({
      where: {
        restaurantId,
        dueDate: Between(
          periodFrom.toISOString().slice(0, 10),
          periodTo.toISOString().slice(0, 10),
        ),
      },
    });
    const categoryMap = new Map<ExpenseCategory, number>();
    for (const category of Object.values(ExpenseCategory)) {
      categoryMap.set(category, 0);
    }
    for (const expense of expenses) {
      categoryMap.set(
        expense.category,
        (categoryMap.get(expense.category) ?? 0) + Number(expense.amount),
      );
    }
    const operatingExpenses = expenses.reduce((sum, entry) => sum + Number(entry.amount), 0);
    const expensesByCategory = Array.from(categoryMap.entries())
      .filter(([, amount]) => amount > 0)
      .map(([category, amount]) => ({
        category,
        label: EXPENSE_CATEGORY_LABELS[category],
        amount,
      }))
      .sort((a, b) => b.amount - a.amount);

    const netProfit = grossProfit - operatingExpenses;
    const netMarginPercent = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;

    return {
      period: {
        from: periodFrom.toISOString().slice(0, 10),
        to: periodTo.toISOString().slice(0, 10),
      },
      grossRevenue,
      cancelledOrdersValue,
      netRevenue: grossRevenue,
      theoreticalCmv: cmvReport.theoreticalCmv,
      grossProfit,
      grossMarginPercent,
      operatingExpenses,
      expensesByCategory,
      netProfit,
      netMarginPercent,
      realCmv: cmvReport.realCmv,
      cmvVariance: cmvReport.variance,
    };
  }

  async getCashClosing(
    restaurantId: string,
    date?: string,
  ): Promise<CashClosingDto> {
    const target = date ? new Date(date) : new Date();
    target.setHours(0, 0, 0, 0);
    const dayEnd = new Date(target);
    dayEnd.setHours(23, 59, 59, 999);

    const orders = await this.ordersRepo.find({
      where: {
        restaurantId,
        createdAt: Between(target, dayEnd),
      },
    });
    const revenueOrders = orders.filter((order) => this.isRevenueOrder(order));

    const revenue = revenueOrders.reduce((sum, order) => sum + Number(order.total), 0);
    const ordersCount = revenueOrders.length;
    const averageTicket = ordersCount > 0 ? revenue / ordersCount : 0;

    let pixTotal = 0;
    let cardTotal = 0;
    let otherPaymentsTotal = 0;
    let tableRevenue = 0;
    let deliveryRevenue = 0;

    for (const order of revenueOrders) {
      const total = Number(order.total);
      if (order.channel === MenuChannel.TABLE) tableRevenue += total;
      if (order.channel === MenuChannel.DELIVERY) deliveryRevenue += total;

      switch (order.paymentMethod) {
        case PaymentMethod.PIX:
          pixTotal += total;
          break;
        case PaymentMethod.CARD:
        case PaymentMethod.APPLE_PAY:
        case PaymentMethod.GOOGLE_PAY:
          cardTotal += total;
          break;
        default:
          otherPaymentsTotal += total;
          break;
      }
    }

    const paidExpenses = await this.expensesRepo.find({
      where: {
        restaurantId,
        paidAt: Between(target, dayEnd),
      },
    });
    const expensesPaid = paidExpenses.reduce((sum, entry) => sum + Number(entry.amount), 0);

    return {
      date: target.toISOString().slice(0, 10),
      revenue,
      ordersCount,
      averageTicket,
      pixTotal,
      cardTotal,
      otherPaymentsTotal,
      tableRevenue,
      deliveryRevenue,
      expensesPaid,
      netCashFlow: revenue - expensesPaid,
    };
  }

  async listExpenses(restaurantId: string, from?: string, to?: string): Promise<ExpenseDto[]> {
    const { periodFrom, periodTo } = this.resolvePeriod(from, to);
    const expenses = await this.expensesRepo.find({
      where: {
        restaurantId,
        dueDate: Between(
          periodFrom.toISOString().slice(0, 10),
          periodTo.toISOString().slice(0, 10),
        ),
      },
      order: { dueDate: 'ASC', createdAt: 'ASC' },
    });
    return expenses.map((entry) => this.mapExpense(entry));
  }

  async createExpense(restaurantId: string, dto: CreateExpenseDto): Promise<ExpenseDto> {
    const expense = this.expensesRepo.create({
      restaurantId,
      category: dto.category,
      description: dto.description.trim(),
      amount: dto.amount,
      dueDate: dto.dueDate,
      paidAt: dto.paid ? new Date() : null,
    });
    const saved = await this.expensesRepo.save(expense);
    return this.mapExpense(saved);
  }

  async updateExpense(
    id: string,
    restaurantId: string,
    dto: UpdateExpenseDto,
  ): Promise<ExpenseDto> {
    const expense = await this.expensesRepo.findOne({ where: { id, restaurantId } });
    if (!expense) throw new NotFoundException('Despesa não encontrada');

    if (dto.category !== undefined) expense.category = dto.category;
    if (dto.description !== undefined) expense.description = dto.description.trim();
    if (dto.amount !== undefined) expense.amount = dto.amount;
    if (dto.dueDate !== undefined) expense.dueDate = dto.dueDate;
    if (dto.paid !== undefined) {
      expense.paidAt = dto.paid ? expense.paidAt ?? new Date() : null;
    }

    const saved = await this.expensesRepo.save(expense);
    return this.mapExpense(saved);
  }

  async deleteExpense(id: string, restaurantId: string): Promise<void> {
    const expense = await this.expensesRepo.findOne({ where: { id, restaurantId } });
    if (!expense) throw new NotFoundException('Despesa não encontrada');
    await this.expensesRepo.remove(expense);
  }

  private mapExpense(expense: Expense): ExpenseDto {
    return {
      id: expense.id,
      category: expense.category,
      description: expense.description,
      amount: Number(expense.amount),
      dueDate: expense.dueDate,
      paidAt: expense.paidAt ? expense.paidAt.toISOString() : null,
      createdAt: expense.createdAt.toISOString(),
    };
  }
}
