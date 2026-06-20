export type BotIntent =
  | 'greeting'
  | 'menu'
  | 'order_status'
  | 'hours'
  | 'address'
  | 'human_handoff'
  | 'thanks'
  | 'menu_question'
  | 'unknown';

const GREETING_PATTERN =
  /^(oi|olá|ola|bom dia|boa tarde|boa noite|hey|hello|hi|e aí|eai|salve|opa|fala)\b/i;
const MENU_PATTERN =
  /(card[aá]pio|menu|ver menu|fazer pedido|quero pedir|delivery|link do pedido|pedir online)/i;
const ORDER_PATTERN =
  /(pedido|status|acompanhar|rastrear|onde est[aá]|meu pedido|n[uú]mero do pedido)/i;
const HOURS_PATTERN = /(hor[aá]rio|funcionamento|abre|aberto|fecha|funciona)/i;
const ADDRESS_PATTERN = /(endere[cç]o|onde fica|localiza[cç][aã]o|como chegar)/i;
const HUMAN_PATTERN =
  /(atendente|humano|pessoa|falar com algu[eé]m|gerente|operador|suporte humano)/i;
const THANKS_PATTERN = /^(obrigad[oa]|valeu|brigad[oa]|thanks|thank you)\b/i;

const MENU_QUESTION_PATTERN =
  /(tem |têm |existe |qual |quanto |preço|preco|valor|vegano|vegetariano|sem gl[uú]ten|bebida|sobremesa|porção|porcao|serve quantas|indica|recomenda|mais vendido|promo|c promoção|cupom|taxa de entrega|tempo de entrega|demora)/i;

export function classifyIntent(message: string): BotIntent {
  const text = message.trim();
  if (!text) return 'unknown';

  if (HUMAN_PATTERN.test(text)) return 'human_handoff';
  if (THANKS_PATTERN.test(text)) return 'thanks';
  if (MENU_PATTERN.test(text)) return 'menu';
  if (ORDER_PATTERN.test(text)) return 'order_status';
  if (HOURS_PATTERN.test(text)) return 'hours';
  if (ADDRESS_PATTERN.test(text)) return 'address';
  if (GREETING_PATTERN.test(text)) return 'greeting';
  if (MENU_QUESTION_PATTERN.test(text)) return 'menu_question';

  return 'unknown';
}

export function shouldUseAi(intent: BotIntent): boolean {
  return intent === 'menu_question' || intent === 'unknown';
}
