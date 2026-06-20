import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { WhatsAppConnectionStatusDto } from '@pedidonamesa/shared';

@Injectable()
export class WhatsAppBridgeService {
  constructor(private readonly config: ConfigService) {}

  private get serviceUrl(): string | null {
    const url = this.config.get<string>('WHATSAPP_BOT_SERVICE_URL')?.trim();
    return url ? url.replace(/\/$/, '') : null;
  }

  private get apiKey(): string | null {
    return this.config.get<string>('WHATSAPP_BOT_API_KEY')?.trim() || null;
  }

  private headers(): HeadersInit {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (this.apiKey) {
      headers.Authorization = `Bearer ${this.apiKey}`;
    }
    return headers;
  }

  async getConnectionStatus(): Promise<WhatsAppConnectionStatusDto> {
    const baseUrl = this.serviceUrl;

    if (!baseUrl) {
      return {
        configured: false,
        reachable: false,
        state: 'unconfigured',
        qrDataUrl: null,
        connectedPhone: null,
        message: 'Serviço do bot não configurado. Defina WHATSAPP_BOT_SERVICE_URL na API.',
        updatedAt: new Date().toISOString(),
      };
    }

    try {
      const response = await fetch(`${baseUrl}/status`, {
        headers: this.headers(),
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`Bot status HTTP ${response.status}`);
      }

      const data = (await response.json()) as {
        state: WhatsAppConnectionStatusDto['state'];
        qrDataUrl: string | null;
        connectedPhone: string | null;
        message: string | null;
        updatedAt: string;
      };

      return {
        configured: true,
        reachable: true,
        state: data.state,
        qrDataUrl: data.qrDataUrl,
        connectedPhone: data.connectedPhone,
        message: data.message,
        updatedAt: data.updatedAt,
      };
    } catch {
      return {
        configured: true,
        reachable: false,
        state: 'offline',
        qrDataUrl: null,
        connectedPhone: null,
        message:
          'Serviço do bot está offline. Inicie com pnpm dev:whatsapp (local) ou o container whatsapp-bot.',
        updatedAt: new Date().toISOString(),
      };
    }
  }

  async disconnectSession(): Promise<WhatsAppConnectionStatusDto> {
    const baseUrl = this.serviceUrl;

    if (!baseUrl) {
      throw new ServiceUnavailableException('Serviço do bot não configurado.');
    }

    const response = await fetch(`${baseUrl}/session/logout`, {
      method: 'POST',
      headers: this.headers(),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new ServiceUnavailableException('Não foi possível encerrar a sessão do WhatsApp.');
    }

    const data = (await response.json()) as {
      state: WhatsAppConnectionStatusDto['state'];
      qrDataUrl: string | null;
      connectedPhone: string | null;
      message: string | null;
      updatedAt: string;
    };

    return {
      configured: true,
      reachable: true,
      state: data.state,
      qrDataUrl: data.qrDataUrl,
      connectedPhone: data.connectedPhone,
      message: data.message,
      updatedAt: data.updatedAt,
    };
  }
}
