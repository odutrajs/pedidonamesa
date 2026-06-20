import fs from 'node:fs/promises';
import {
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  makeWASocket,
  useMultiFileAuthState,
  type WASocket,
} from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import type { Logger } from 'pino';
import type { BotEnv } from './config.js';
import { extractPhone, extractText } from './handler.js';
import type { MessageHandler } from './handler.js';
import { connectionStatus } from './status.js';

let socket: WASocket | null = null;
let connecting = false;

async function clearAuthDir(authDir: string) {
  await fs.rm(authDir, { recursive: true, force: true });
  await fs.mkdir(authDir, { recursive: true });
}

export async function logoutWhatsApp(env: BotEnv, logger: Logger): Promise<void> {
  socket?.end(undefined);
  socket = null;
  connecting = false;
  await clearAuthDir(env.authDir);
  connectionStatus.setConnecting('Gerando novo QR code...');
  await connectWhatsApp(env, logger, null);
}

export async function connectWhatsApp(
  env: BotEnv,
  logger: Logger,
  handler: MessageHandler | null,
): Promise<void> {
  if (connecting) return;

  connecting = true;
  connectionStatus.setConnecting();

  try {
    const { state, saveCreds } = await useMultiFileAuthState(env.authDir);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger),
      },
      logger,
      printQRInTerminal: false,
      syncFullHistory: false,
      markOnlineOnConnect: true,
    });

    socket = sock;

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        const qrDataUrl = await QRCode.toDataURL(qr, { margin: 1, width: 280 });
        connectionStatus.setQrPending(qrDataUrl);
        logger.info('QR code updated — available via admin panel');
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as { output?: { statusCode?: number } })?.output
          ?.statusCode;
        const loggedOut = statusCode === DisconnectReason.loggedOut;
        socket = null;
        connecting = false;

        if (loggedOut) {
          connectionStatus.setLoggedOut();
          logger.warn('WhatsApp logged out — scan QR again from admin');
          return;
        }

        connectionStatus.setDisconnected();
        logger.warn({ statusCode }, 'WhatsApp connection closed, reconnecting');
        setTimeout(() => {
          connectWhatsApp(env, logger, handler).catch((error) =>
            logger.error({ error }, 'Reconnect failed'),
          );
        }, 3000);
      }

      if (connection === 'open') {
        connecting = false;
        const phone = sock.user?.id ? extractPhone(sock.user.id) : null;
        connectionStatus.setConnected(phone);
        logger.info({ slug: env.restaurantSlug, phone }, 'WhatsApp bot connected');
      }
    });

    if (handler) {
      sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        for (const incoming of messages) {
          if (incoming.key.fromMe || !incoming.message) continue;

          const jid = incoming.key.remoteJid;
          if (!jid || jid.endsWith('@g.us')) continue;

          const text = extractText(incoming.message);
          if (!text) continue;

          try {
            const reply = await handler.handle(
              jid,
              text,
              extractPhone(jid),
              incoming.key.id ?? undefined,
            );
            if (reply) {
              await sock.sendMessage(jid, { text: reply });
            }
          } catch (error) {
            logger.error({ error, jid }, 'Failed to handle message');
            await sock.sendMessage(jid, {
              text: 'Desculpe, tive um problema agora. Tente novamente em instantes ou digite *cardápio*.',
            });
          }
        }
      });
    }
  } catch (error) {
    connecting = false;
    connectionStatus.setDisconnected('Erro ao conectar. Tentando novamente...');
    logger.error({ error }, 'WhatsApp connect failed');
    setTimeout(() => {
      connectWhatsApp(env, logger, handler).catch((err) =>
        logger.error({ err }, 'Reconnect failed'),
      );
    }, 5000);
  }
}

export function getSocket(): WASocket | null {
  return socket;
}
