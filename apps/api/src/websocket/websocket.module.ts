import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OrdersGateway } from './orders.gateway';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'dev-secret-change-me'),
      }),
    }),
    forwardRef(() => OrdersModule),
  ],
  providers: [OrdersGateway],
  exports: [OrdersGateway],
})
export class WebsocketModule {}
