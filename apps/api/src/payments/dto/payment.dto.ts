import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaymentMode } from '@pedidonamesa/shared';

export class ConfirmStripePaymentDto {
  @IsString()
  paymentIntentId: string;
}

export class UpdatePaymentSettingsDto {
  @IsEnum(PaymentMode)
  paymentMode: PaymentMode;
}

export class MercadoPagoWebhookDto {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  data?: { id?: string };
}
