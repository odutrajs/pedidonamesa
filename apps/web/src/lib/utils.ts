export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function parsePriceInput(value: string): number {
  const normalized = value.trim().replace(',', '.');
  if (!normalized) return NaN;
  return parseFloat(normalized);
}

export function formatTime(date: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatRelativeTime(date: string) {
  const diffMs = Date.now() - new Date(date).getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'agora';
  if (diffMin === 1) return 'há 1 min';
  if (diffMin < 60) return `há ${diffMin} min`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours === 1) return 'há 1 h';
  return `há ${diffHours} h`;
}

export function playNewOrderSound() {
  try {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.3);
  } catch {
    // ignore if audio blocked
  }
}
