import pino from 'pino';
import { ApiClient } from './api-client.js';
import { AiAssistant } from './ai.js';
import { loadEnv } from './config.js';
import { connectWhatsApp, logoutWhatsApp } from './connection.js';
import { HandoffStore, MessageHandler } from './handler.js';
import { ConversationStore } from './conversation-store.js';
import { startHttpServer } from './http-server.js';

const env = loadEnv();
const logger = pino({ level: process.env.LOG_LEVEL ?? 'info' });
const api = new ApiClient(env);
const ai = new AiAssistant(env);
const handoff = new HandoffStore(env.handoffMinutes);
const conversations = new ConversationStore({
  sessionTtlMs: env.sessionTtlMs,
  maxHistory: env.maxHistory,
  maxMessagesPerMinute: env.maxMessagesPerMinute,
  duplicateWindowMs: env.duplicateWindowMs,
  maxConsecutiveBotReplies: env.maxConsecutiveBotReplies,
});
const handler = new MessageHandler(env, api, ai, handoff, conversations);

startHttpServer(env, logger, () => logoutWhatsApp(env, logger));

logger.info(
  {
    slug: env.restaurantSlug,
    api: env.apiBaseUrl,
    ai: ai.enabled,
    authDir: env.authDir,
    httpPort: env.httpPort,
  },
  'Starting WhatsApp bot',
);

connectWhatsApp(env, logger, handler)
  .then(() => api.getConfig(true))
  .catch((error) => logger.error({ error }, 'Initial config fetch failed'));

process.on('SIGINT', () => {
  logger.info('Shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Shutting down...');
  process.exit(0);
});
