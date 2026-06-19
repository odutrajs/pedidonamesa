import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { ConfirmStripePaymentDto } from './dto/payment.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('mesa/:token/orders/:orderId/stripe')
  createStripeCheckout(
    @Param('token') token: string,
    @Param('orderId') orderId: string,
  ) {
    return this.paymentsService.createStripeCheckout(token, orderId);
  }

  @Post('mesa/:token/orders/:orderId/pix')
  createPixCheckout(@Param('token') token: string, @Param('orderId') orderId: string) {
    return this.paymentsService.createPixCheckout(token, orderId);
  }

  @Post('mesa/:token/orders/:orderId/confirm-stripe')
  confirmStripePayment(
    @Param('token') token: string,
    @Param('orderId') orderId: string,
    @Body() dto: ConfirmStripePaymentDto,
  ) {
    return this.paymentsService.confirmStripePayment(token, orderId, dto.paymentIntentId);
  }

  @Post('mesa/:token/orders/:orderId/mock')
  mockPayment(@Param('token') token: string, @Param('orderId') orderId: string) {
    return this.paymentsService.mockPayment(token, orderId);
  }

  @Get('mesa/:token/orders/:orderId/status')
  getPaymentStatus(@Param('token') token: string, @Param('orderId') orderId: string) {
    return this.paymentsService.syncPaymentStatus(token, orderId);
  }

  @Post('webhooks/stripe')
  stripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.paymentsService.handleStripeWebhook(req.rawBody as Buffer, signature);
  }

  @Post('webhooks/mercadopago')
  mercadoPagoWebhook(@Body() body: { data?: { id?: string }; type?: string }) {
    const paymentId = body?.data?.id;
    return this.paymentsService.handleMercadoPagoWebhook(String(paymentId ?? ''));
  }
}
