import { io, Socket } from 'socket.io-client';
import { WS_EVENTS } from '@pedidonamesa/shared';

let socket: Socket | null = null;
let activeToken: string | null = null;

function getSocketBaseUrl(): string | undefined {
  const apiUrl = import.meta.env.VITE_API_URL as string | undefined;

  if (apiUrl?.startsWith('http')) {
    return new URL(apiUrl).origin;
  }

  if (import.meta.env.DEV) {
    return 'http://localhost:3000';
  }

  return undefined;
}

export function connectOrdersSocket(token: string) {
  if (socket?.connected && activeToken === token) {
    return socket;
  }

  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  activeToken = token;
  const baseUrl = getSocketBaseUrl();

  socket = io(`${baseUrl ?? ''}/orders`, {
    auth: { token },
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
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
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
  activeToken = null;
}
