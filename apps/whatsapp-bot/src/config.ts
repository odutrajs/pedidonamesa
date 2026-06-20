import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { WhatsAppBotConfigDto } from '@pedidonamesa/shared';

const ENV_FILES = [
  path.resolve(process.cwd(), '.env.whatsapp'),
  path.resolve(process.cwd(), '../../.env.whatsapp'),
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../.env.whatsapp'),
];

function loadEnvFiles() {
  for (const filePath of ENV_FILES) {
    if (!fs.existsSync(filePath)) continue;

    const content = fs.readFileSync(filePath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const separator = trimmed.indexOf('=');
      if (separator === -1) continue;

      const key = trimmed.slice(0, separator).trim();
      const value = trimmed.slice(separator + 1).trim();
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }
}

loadEnvFiles();

export interface BotEnv {
  restaurantSlug: string;
  apiBaseUrl: string;
  openAiApiKey: string | null;
  openAiModel: string;
  authDir: string;
  configRefreshMs: number;
  handoffMinutes: number;
  httpPort: number;
  apiKey: string | null;
  sessionTtlMs: number;
  maxHistory: number;
  maxMessagesPerMinute: number;
  duplicateWindowMs: number;
  maxConsecutiveBotReplies: number;
}

export function loadEnv(): BotEnv {
  const restaurantSlug = process.env.RESTAURANT_SLUG?.trim();
  const apiBaseUrl = process.env.API_BASE_URL?.trim().replace(/\/$/, '');

  if (!restaurantSlug) {
    throw new Error('RESTAURANT_SLUG is required');
  }

  if (!apiBaseUrl) {
    throw new Error('API_BASE_URL is required');
  }

  return {
    restaurantSlug,
    apiBaseUrl,
    openAiApiKey: process.env.OPENAI_API_KEY?.trim() || null,
    openAiModel: process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini',
    authDir: process.env.BAILEYS_AUTH_DIR?.trim() || './auth',
    configRefreshMs: Number(process.env.CONFIG_REFRESH_MS ?? 60_000),
    handoffMinutes: Number(process.env.HANDOFF_MINUTES ?? 30),
    httpPort: Number(process.env.HTTP_PORT ?? 3001),
    apiKey: process.env.WHATSAPP_BOT_API_KEY?.trim() || null,
    sessionTtlMs: Number(process.env.SESSION_TTL_MS ?? 30 * 60_000),
    maxHistory: Number(process.env.MAX_CONVERSATION_HISTORY ?? 6),
    maxMessagesPerMinute: Number(process.env.MAX_MESSAGES_PER_MINUTE ?? 8),
    duplicateWindowMs: Number(process.env.DUPLICATE_MESSAGE_WINDOW_MS ?? 15_000),
    maxConsecutiveBotReplies: Number(process.env.MAX_CONSECUTIVE_BOT_REPLIES ?? 5),
  };
}

export type CachedConfig = WhatsAppBotConfigDto & { fetchedAt: number };
