export type BotConnectionState =
  | 'connecting'
  | 'qr_pending'
  | 'connected'
  | 'logged_out'
  | 'disconnected';

export interface BotStatusSnapshot {
  state: BotConnectionState;
  qrDataUrl: string | null;
  connectedPhone: string | null;
  message: string | null;
  updatedAt: string;
}

class ConnectionStatus {
  private snapshot: BotStatusSnapshot = {
    state: 'connecting',
    qrDataUrl: null,
    connectedPhone: null,
    message: null,
    updatedAt: new Date().toISOString(),
  };

  get(): BotStatusSnapshot {
    return { ...this.snapshot };
  }

  setConnecting(message?: string) {
    this.update({
      state: 'connecting',
      qrDataUrl: null,
      connectedPhone: null,
      message: message ?? 'Conectando ao WhatsApp...',
    });
  }

  setQrPending(qrDataUrl: string) {
    this.update({
      state: 'qr_pending',
      qrDataUrl,
      connectedPhone: null,
      message: 'Escaneie o QR code no WhatsApp (Aparelhos conectados).',
    });
  }

  setConnected(connectedPhone: string | null) {
    this.update({
      state: 'connected',
      qrDataUrl: null,
      connectedPhone,
      message: connectedPhone
        ? `Conectado como ${connectedPhone}.`
        : 'WhatsApp conectado.',
    });
  }

  setLoggedOut(message?: string) {
    this.update({
      state: 'logged_out',
      qrDataUrl: null,
      connectedPhone: null,
      message: message ?? 'Sessão encerrada. Gere um novo QR code para reconectar.',
    });
  }

  setDisconnected(message?: string) {
    this.update({
      state: 'disconnected',
      qrDataUrl: null,
      connectedPhone: null,
      message: message ?? 'Desconectado. Tentando reconectar...',
    });
  }

  private update(partial: Omit<BotStatusSnapshot, 'updatedAt'>) {
    this.snapshot = {
      ...partial,
      updatedAt: new Date().toISOString(),
    };
  }
}

export const connectionStatus = new ConnectionStatus();
