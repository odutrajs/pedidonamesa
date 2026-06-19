import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { MenuModule } from './menu/menu.module';
import { OrdersModule } from './orders/orders.module';
import { WebsocketModule } from './websocket/websocket.module';
import { AdminModule } from './admin/admin.module';
import { StorageModule } from './storage/storage.module';
import { BootstrapModule } from './bootstrap/bootstrap.module';
import * as entities from './entities';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../infra/.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: Number(config.get('DB_PORT', 5432)),
        username: config.get('DB_USER', 'pedidonamesa'),
        password: config.get('DB_PASSWORD', 'pedidonamesa'),
        database: config.get('DB_NAME', 'pedidonamesa'),
        entities: Object.values(entities),
        synchronize: config.get('DB_SYNC', 'true') === 'true',
        logging: config.get('DB_LOGGING', 'false') === 'true',
      }),
    }),
    AuthModule,
    MenuModule,
    OrdersModule,
    WebsocketModule,
    AdminModule,
    StorageModule,
    BootstrapModule,
  ],
})
export class AppModule {}
