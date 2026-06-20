export type GuardrailResult =
  | { allowed: true }
  | { allowed: false; reason: 'prompt_injection' | 'off_topic' | 'frustration' };

const PROMPT_INJECTION_PATTERNS = [
  /ignore (all|previous|above|prior) (instructions|rules|prompts)/i,
  /forget (all|your|the) (instructions|rules|prompt)/i,
  /you are now/i,
  /act as (a |an )?(?!atendente|garçom|garcom)/i,
  /new instructions:/i,
  /system prompt/i,
  /jailbreak/i,
  /\bdan mode\b/i,
  /desconsidere (suas|as) instru/i,
  /finja que (você|voce) (é|e)/i,
  /modo desenvolvedor/i,
];

const OFF_TOPIC_PATTERNS = [
  /\b(código|codigo|programa(r|ção)|python|javascript|typescript|sql|api rest)\b/i,
  /\b(política|politica|eleição|eleicao|presidente|partido)\b/i,
  /\b(receita médica|remédio|remedio|diagnóstico|diagnostico|doença|doenca)\b/i,
  /\b(investimento|cripto|bitcoin|açõe?s|bolsa de valores)\b/i,
  /\b(redação|redacao|tcc|dissertação|dissertacao|trabalho escolar)\b/i,
  /\b(clima|tempo hoje|previsão do tempo|previsao do tempo)\b/i,
  /\b(futebol|campeonato|jogo de ontem)\b/i,
];

const FRUSTRATION_PATTERNS = [
  /\b(n[ãa]o (entende|funciona|presta|serve|ajuda))\b/i,
  /\b(péssimo|pessimo|horrível|horrivel|inútil|inutil)\b/i,
  /\b(cancela(r)? tudo|quero reclamar|vou processar)\b/i,
  /\b(me (ignora|deixa)|para de (responder|mandar))\b/i,
];

export function normalizeForCompare(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function evaluateGuardrails(message: string): GuardrailResult {
  const normalized = message.trim();

  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(normalized)) {
      return { allowed: false, reason: 'prompt_injection' };
    }
  }

  for (const pattern of OFF_TOPIC_PATTERNS) {
    if (pattern.test(normalized)) {
      return { allowed: false, reason: 'off_topic' };
    }
  }

  for (const pattern of FRUSTRATION_PATTERNS) {
    if (pattern.test(normalized)) {
      return { allowed: false, reason: 'frustration' };
    }
  }

  return { allowed: true };
}

export function buildGuardrailReply(
  reason: 'prompt_injection' | 'off_topic' | 'frustration',
  deliveryMenuUrl: string,
): string {
  switch (reason) {
    case 'prompt_injection':
      return (
        'Sou o assistente do restaurante e posso ajudar só com *cardápio*, *pedidos*, *horário* e *endereço*.\n\n' +
        `Para pedir: ${deliveryMenuUrl}`
      );
    case 'off_topic':
      return (
        'Posso ajudar apenas com assuntos do restaurante: cardápio, pedidos, horário e endereço.\n\n' +
        `Digite *cardápio* ou acesse: ${deliveryMenuUrl}`
      );
    case 'frustration':
      return (
        '🙋 Entendo sua frustração. Vou encaminhar você para nossa equipe.\n\n' +
        'Um atendente humano continuará em breve. Se preferir, digite *cardápio* para fazer um novo pedido.'
      );
    default:
      return `Digite *cardápio* ou acesse: ${deliveryMenuUrl}`;
  }
}

export function isSimilarReply(a: string, b: string): boolean {
  const left = normalizeForCompare(a);
  const right = normalizeForCompare(b);
  if (!left || !right) return false;
  if (left === right) return true;

  const shorter = left.length <= right.length ? left : right;
  const longer = left.length > right.length ? left : right;
  return longer.includes(shorter) && shorter.length / longer.length > 0.85;
}
