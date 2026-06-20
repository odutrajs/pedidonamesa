import type { WhatsAppBotConfigDto, WhatsAppOrderStatusDto } from '@pedidonamesa/shared';
import type { BotEnv, CachedConfig } from './config.js';

export class ApiClient {
  private cached: CachedConfig | null = null;

  constructor(private readonly env: BotEnv) {}

  async getConfig(force = false): Promise<WhatsAppBotConfigDto> {
    const now = Date.now();
    if (!force && this.cached && now - this.cached.fetchedAt < this.env.configRefreshMs) {
      const { fetchedAt: _fetchedAt, ...config } = this.cached;
      return config;
    }

    const response = await fetch(`${this.env.apiBaseUrl}/api/bot/${this.env.restaurantSlug}/config`);
    if (!response.ok) {
      throw new Error(`Failed to load bot config: ${response.status}`);
    }

    const config = (await response.json()) as WhatsAppBotConfigDto;
    this.cached = { ...config, fetchedAt: now };
    return config;
  }

  async getLatestOrder(phone: string): Promise<WhatsAppOrderStatusDto> {
    const params = new URLSearchParams({ phone });
    const response = await fetch(
      `${this.env.apiBaseUrl}/api/bot/${this.env.restaurantSlug}/orders/latest?${params}`,
    );

    if (!response.ok) {
      throw new Error(`Failed to load order status: ${response.status}`);
    }

    return (await response.json()) as WhatsAppOrderStatusDto;
  }
}
