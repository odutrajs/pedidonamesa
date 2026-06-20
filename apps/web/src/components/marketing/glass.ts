import { cn } from '../../lib/cn';

/** Card base com efeito glassmorphism */
export const glassCard =
  'relative overflow-hidden rounded-3xl border border-white/20 bg-white/[0.07] shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-2xl backdrop-saturate-150';

export const glassCardHover =
  'transition duration-500 hover:border-white/30 hover:bg-white/[0.1] hover:shadow-[0_12px_40px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.16)]';

export const glassShine =
  'pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.1] via-transparent to-blue-500/[0.08]';

export const glassIconBox =
  'flex items-center justify-center rounded-2xl border border-white/15 bg-white/[0.08] backdrop-blur-md';

export const glassInput =
  'border border-white/15 bg-white/[0.06] backdrop-blur-md focus:border-white/30 focus:bg-white/[0.1] focus:ring-2 focus:ring-white/10';

export function glassPanel(...extra: Parameters<typeof cn>) {
  return cn(glassCard, ...extra);
}
