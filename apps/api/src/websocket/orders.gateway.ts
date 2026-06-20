import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { WS_EVENTS, OrderDto } from '@pedidonamesa/shared';
import { JwtPayload } from '../auth/auth.service';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:5173'],
    credentials: true,
  },
  namespace: '/orders',
})
export class OrdersGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    const token =
      (client.handshake.auth?.token as string) ||
      (client.handshake.query?.token as string);

    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      if (!payload.restaurantId) {
        client.disconnect();
        return;
      }
      client.data.restaurantId = payload.restaurantId;
      client.data.userId = payload.sub;
      client.join(this.roomFor(payload.restaurantId));
    } catch {
      client.disconnect();
    }
  }

  @SubscribeMessage(WS_EVENTS.KITCHEN_JOIN)
  handleKitchenJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { restaurantId?: string },
  ) {
    const restaurantId = client.data.restaurantId ?? data.restaurantId;
    if (restaurantId) {
      client.join(this.roomFor(restaurantId));
    }
  }

  emitOrderCreated(restaurantId: string, order: OrderDto) {
    this.server.to(this.roomFor(restaurantId)).emit(WS_EVENTS.ORDER_CREATED, order);
  }

  emitOrderUpdated(restaurantId: string, order: OrderDto) {
    this.server.to(this.roomFor(restaurantId)).emit(WS_EVENTS.ORDER_UPDATED, order);
  }

  emitOrderItemUpdated(restaurantId: string, order: OrderDto, itemId: string) {
    this.server
      .to(this.roomFor(restaurantId))
      .emit(WS_EVENTS.ORDER_ITEM_UPDATED, { order, itemId });
  }

  private roomFor(restaurantId: string) {
    return `restaurant:${restaurantId}`;
  }
}
