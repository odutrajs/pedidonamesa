import { io, Socket } from 'socket.io-client';
import { WS_EVENTS } from '@pedidonamesa/shared';

let socket: Socket | null = null;

export function connectOrdersSocket(token: string) {
  if (socket?.connected) {
    socket.disconnect();
  }

  socket = io('/orders', {
    auth: { token },
    transports: ['websocket'],
  });

  socket.on('connect', () => {
    socket?.emit(WS_EVENTS.KITCHEN_JOIN);
  });

  return socket;
}

export function getOrdersSocket() {
  return socket;
}

export function disconnectOrdersSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
