import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PaymentMethod,
  PaymentStatus,
  PixCheckoutDto,
  StripeCheckoutDto,
  MenuChannel,
} from '@pedidonamesa/shared';
import Stripe from 'stripe';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { Order, Restaurant, Table } from '../entities';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class PaymentsService {
  private stripe: Stripe | null;
  private mercadoPagoPayment: Payment | null;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(Order)
    private readonly ordersRepo: Repository<Order>,
    @InjectRepository(Table)
    private readonly tablesRepo: Repository<Table>,
    @InjectRepository(Restaurant)
    private readonly restaurantsRepo: Repository<Restaurant>,
    private readonly ordersService: OrdersService,
  ) {
    const stripeKey = this.config.get<string>('STRIPE_SECRET_KEY');
    this.stripe = stripeKey ? new Stripe(stripeKey) : null;

    const mpToken = this.config.get<string>('MERCADOPAGO_ACCESS_TOKEN');
    if (mpToken) {
      const client = new MercadoPagoConfig({ accessToken: mpToken });
      this.mercadoPagoPayment = new Payment(client);
    } else {
      this.mercadoPagoPayment = null;
    }
  }

  getStripePublishableKey(): string | null {
    return this.config.get<string>('STRIPE_PUBLISHABLE_KEY') ?? null;
  }

  async createStripeCheckout(tableToken: string, orderId: string): Promise<StripeCheckoutDto> {
    const order = await this.getPayableOrder({ kind: 'table', token: tableToken }, orderId);
    return this.createStripeCheckoutForOrder(order, tableToken);
  }

  async createStripeCheckoutForDelivery(slug: string, orderId: string): Promise<StripeCheckoutDto> {
    const order = await this.getPayableOrder({ kind: 'delivery', slug }, orderId);
    return this.createStripeCheckoutForOrder(order, slug);
  }

  private async createStripeCheckoutForOrder(
    order: Order,
    contextKey: string,
  ): Promise<StripeCheckoutDto> {

    if (!this.stripe) {
      throw new BadRequestException('Stripe não configurado');
    }

    const publishableKey = this.getStripePublishableKey();
    if (!publishableKey) {
      throw new BadRequestException('Chave pública do Stripe não configurada');
    }

    const amountCents = Math.round(Number(order.total) * 100);

    if (order.stripePaymentIntentId) {
      try {
        const existing = await this.stripe.paymentIntents.retrieve(order.stripePaymentIntentId);
        if (existing.status === 'succeeded') {
          await this.ordersService.markOrderPaid(order.id, PaymentMethod.CARD);
          throw new BadRequestException('Pedido já foi pago');
        }
        if (existing.status !== 'canceled' && existing.amount === amountCents) {
          return {
            clientSecret: existing.client_secret!,
            publishableKey,
          };
        }
      } catch (err) {
        if (err instanceof BadRequestException) throw err;
        order.stripePaymentIntentId = null;
        await this.ordersRepo.save(order);
      }
    }

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'brl',
      payment_method_types: ['card'],
      metadata: {
        orderId: order.id,
        contextKey,
        restaurantId: order.restaurantId,
      },
    });

    order.stripePaymentIntentId = paymentIntent.id;
    await this.ordersRepo.save(order);

    return {
      clientSecret: paymentIntent.client_secret!,
      publishableKey,
    };
  }

  async createPixCheckout(tableToken: string, orderId: string): Promise<PixCheckoutDto> {
    const order = await this.getPayableOrder({ kind: 'table', token: tableToken }, orderId);
    return this.createPixCheckoutForOrder(order);
  }

  async createPixCheckoutForDelivery(slug: string, orderId: string): Promise<PixCheckoutDto> {
    const order = await this.getPayableOrder({ kind: 'delivery', slug }, orderId);
    return this.createPixCheckoutForOrder(order);
  }

  private async createPixCheckoutForOrder(order: Order): Promise<PixCheckoutDto> {

    if (!this.mercadoPagoPayment) {
      throw new BadRequestException('Mercado Pago não configurado');
    }

    if (order.mercadoPagoPaymentId) {
      const existing = await this.mercadoPagoPayment.get({
        id: Number(order.mercadoPagoPaymentId),
      });
      if (existing.status === 'approved') {
        await this.ordersService.markOrderPaid(order.id, PaymentMethod.PIX);
        throw new BadRequestException('Pedido já foi pago');
      }
      if (existing.status === 'pending' && existing.point_of_interaction) {
        const tx = existing.point_of_interaction.transaction_data;
        return {
          paymentId: String(existing.id),
          qrCode: tx?.qr_code ?? '',
          qrCodeBase64: tx?.qr_code_base64 ?? '',
          expiresAt: (tx as { date_of_expiration?: string })?.date_of_expiration ?? null,
        };
      }
    }

    const result = await this.mercadoPagoPayment.create({
      body: {
        transaction_amount: Number(order.total),
        description: `Pedido ${order.channel === MenuChannel.DELIVERY ? 'delivery' : 'mesa'} — ${order.id.slice(0, 8)}`,
        payment_method_id: 'pix',
        payer: {
          email: 'cliente@pedidonamesa.com',
        },
        external_reference: order.id,
        notification_url: this.config.get<string>('MERCADOPAGO_WEBHOOK_URL') || undefined,
      },
    });

    order.mercadoPagoPaymentId = String(result.id);
    await this.ordersRepo.save(order);

    const tx = result.point_of_interaction?.transaction_data;

    return {
      paymentId: String(result.id),
      qrCode: tx?.qr_code ?? '',
      qrCodeBase64: tx?.qr_code_base64 ?? '',
      expiresAt: (tx as { date_of_expiration?: string })?.date_of_expiration ?? null,
    };
  }

  async confirmStripePayment(
    tableToken: string,
    orderId: string,
    paymentIntentId: string,
  ) {
    const order = await this.getPayableOrder({ kind: 'table', token: tableToken }, orderId);
    return this.confirmStripePaymentForOrder(order, paymentIntentId);
  }

  async confirmStripePaymentForDelivery(
    slug: string,
    orderId: string,
    paymentIntentId: string,
  ) {
    const order = await this.getPayableOrder({ kind: 'delivery', slug }, orderId);
    return this.confirmStripePaymentForOrder(order, paymentIntentId);
  }

  private async confirmStripePaymentForOrder(order: Order, paymentIntentId: string) {

    if (!this.stripe) {
      throw new BadRequestException('Stripe não configurado');
    }

    let paymentIntent: Stripe.PaymentIntent;
    try {
      paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId, {
        expand: ['payment_method'],
      });
    } catch {
      throw new BadRequestException('Pagamento não encontrado no Stripe');
    }

    if (paymentIntent.metadata.orderId && paymentIntent.metadata.orderId !== order.id) {
      throw new BadRequestException('Pagamento não corresponde ao pedido');
    }

    if (paymentIntent.status !== 'succeeded') {
      throw new BadRequestException('Pagamento ainda não confirmado');
    }

    const method = this.mapStripePaymentMethod(paymentIntent);
    return this.ordersService.markOrderPaid(order.id, method, paymentIntentId);
  }

  async mockPayment(tableToken: string, orderId: string) {
    return this.mockPaymentForScope({ kind: 'table', token: tableToken }, orderId);
  }

  async mockPaymentForDelivery(slug: string, orderId: string) {
    return this.mockPaymentForScope({ kind: 'delivery', slug }, orderId);
  }

  private async mockPaymentForScope(
    scope: { kind: 'table'; token: string } | { kind: 'delivery'; slug: string },
    orderId: string,
  ) {
    const isProd = this.config.get<string>('NODE_ENV') === 'production';
    const mockEnabled = this.config.get<string>('MOCK_PAYMENTS') === 'true';

    if (isProd && !mockEnabled) {
      throw new BadRequestException('Pagamento simulado não disponível');
    }

    const order = await this.getPayableOrder(scope, orderId);
    return this.ordersService.markOrderPaid(order.id, PaymentMethod.CARD);
  }

  async syncPaymentStatus(tableToken: string, orderId: string) {
    return this.syncPaymentStatusForScope({ kind: 'table', token: tableToken }, orderId);
  }

  async syncPaymentStatusForDelivery(slug: string, orderId: string) {
    return this.syncPaymentStatusForScope({ kind: 'delivery', slug }, orderId);
  }

  private async syncPaymentStatusForScope(
    scope: { kind: 'table'; token: string } | { kind: 'delivery'; slug: string },
    orderId: string,
  ) {
    const order = await this.findScopedOrder(scope, orderId);

    if (order.paymentStatus === PaymentStatus.PAID) {
      return this.buildPaymentStatusResponse(order);
    }

    if (order.paymentStatus === PaymentStatus.NOT_REQUIRED) {
      return this.buildPaymentStatusResponse(order);
    }

    if (order.stripePaymentIntentId && this.stripe) {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(
        order.stripePaymentIntentId,
        { expand: ['payment_method'] },
      );
      if (paymentIntent.status === 'succeeded') {
        const method = this.mapStripePaymentMethod(paymentIntent);
        await this.ordersService.markOrderPaid(order.id, method, order.stripePaymentIntentId);
        const updated = await this.ordersRepo.findOne({ where: { id: order.id } });
        return this.buildPaymentStatusResponse(updated!);
      }
    }

    if (order.mercadoPagoPaymentId && this.mercadoPagoPayment) {
      const payment = await this.mercadoPagoPayment.get({
        id: Number(order.mercadoPagoPaymentId),
      });
      if (payment.status === 'approved') {
        await this.ordersService.markOrderPaid(order.id, PaymentMethod.PIX);
        const updated = await this.ordersRepo.findOne({ where: { id: order.id } });
        return this.buildPaymentStatusResponse(updated!);
      }
    }

    return this.buildPaymentStatusResponse(order);
  }

  async handleStripeWebhook(rawBody: Buffer, signature: string) {
    if (!this.stripe) return { received: true };

    const webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) return { received: true };

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch {
      throw new BadRequestException('Assinatura do webhook inválida');
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const orderId = paymentIntent.metadata.orderId;
      if (orderId) {
        const fullIntent = await this.stripe.paymentIntents.retrieve(paymentIntent.id, {
          expand: ['payment_method'],
        });
        const method = this.mapStripePaymentMethod(fullIntent);
        await this.ordersService.markOrderPaid(orderId, method, paymentIntent.id);
      }
    }

    return { received: true };
  }

  async handleMercadoPagoWebhook(paymentId: string) {
    if (!this.mercadoPagoPayment || !paymentId) {
      return { received: true };
    }

    const payment = await this.mercadoPagoPayment.get({ id: Number(paymentId) });
    if (payment.status === 'approved' && payment.external_reference) {
      await this.ordersService.markOrderPaid(
        payment.external_reference,
        PaymentMethod.PIX,
      );
    }

    return { received: true };
  }

  private async getPayableOrder(
    scope: { kind: 'table'; token: string } | { kind: 'delivery'; slug: string },
    orderId: string,
  ): Promise<Order> {
    const order = await this.findScopedOrder(scope, orderId);

    if (order.paymentStatus === PaymentStatus.NOT_REQUIRED) {
      throw new BadRequestException('Este pedido não exige pagamento antecipado');
    }

    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Pedido já foi pago');
    }

    return order;
  }

  private async findScopedOrder(
    scope: { kind: 'table'; token: string } | { kind: 'delivery'; slug: string },
    orderId: string,
  ): Promise<Order> {
    if (scope.kind === 'table') {
      const table = await this.tablesRepo.findOne({
        where: { token: scope.token, active: true },
      });

      if (!table) {
        throw new NotFoundException('Mesa não encontrada');
      }

      const order = await this.ordersRepo.findOne({
        where: { id: orderId, tableId: table.id },
      });

      if (!order) {
        throw new NotFoundException('Pedido não encontrado');
      }

      return order;
    }

    const restaurant = await this.restaurantsRepo.findOne({
      where: { slug: scope.slug, active: true },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurante não encontrado');
    }

    const order = await this.ordersRepo.findOne({
      where: {
        id: orderId,
        restaurantId: restaurant.id,
        channel: MenuChannel.DELIVERY,
      },
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    return order;
  }

  private mapStripePaymentMethod(paymentIntent: Stripe.PaymentIntent): PaymentMethod {
    const paymentMethod = paymentIntent.payment_method as Stripe.PaymentMethod | null;
    if (!paymentMethod) return PaymentMethod.CARD;

    if (paymentMethod.type === 'card' && paymentMethod.card?.wallet) {
      const walletType = paymentMethod.card.wallet.type;
      if (walletType === 'apple_pay') return PaymentMethod.APPLE_PAY;
      if (walletType === 'google_pay') return PaymentMethod.GOOGLE_PAY;
    }

    return PaymentMethod.CARD;
  }

  private buildPaymentStatusResponse(order: Order) {
    return {
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      paidAt: order.paidAt?.toISOString() ?? null,
      orderStatus: order.status,
    };
  }
}
