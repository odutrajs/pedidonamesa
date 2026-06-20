import OpenAI from 'openai';
import type { WhatsAppBotConfigDto } from '@pedidonamesa/shared';
import type { BotEnv } from './config.js';

interface AiStructuredReply {
  in_scope: boolean;
  escalate: boolean;
  reply: string;
}

export class AiAssistant {
  private client: OpenAI | null;

  constructor(private readonly env: BotEnv) {
    this.client = env.openAiApiKey ? new OpenAI({ apiKey: env.openAiApiKey }) : null;
  }

  get enabled() {
    return this.client !== null;
  }

  async reply(
    userMessage: string,
    config: WhatsAppBotConfigDto,
    history: Array<{ role: 'user' | 'assistant'; content: string }>,
  ): Promise<{ text: string; escalate: boolean }> {
    if (!this.client) {
      return {
        text:
          'Posso te ajudar com *cardápio*, *pedido*, *horário* ou *endereço*.\n\n' +
          `Link do cardápio: ${config.deliveryMenuUrl}`,
        escalate: false,
      };
    }

    const systemPrompt = [
      `Você é o assistente virtual do restaurante "${config.restaurantName}" no WhatsApp.`,
      'Responda SOMENTE em JSON válido, sem markdown fora do campo reply.',
      '',
      'Escopo permitido:',
      '- Cardápio, preços e itens (apenas os listados abaixo)',
      '- Como fazer pedido (link delivery)',
      '- Horário e endereço do restaurante',
      '- Status de pedido (orientar a digitar "pedido" se quiser rastrear)',
      '',
      'Proibido:',
      '- Assuntos fora do restaurante (política, código, saúde, investimentos, etc.)',
      '- Inventar itens, preços ou promoções',
      '- Repetir a mesma resposta da conversa anterior',
      '- Respostas longas (máximo 4 linhas no campo reply)',
      '',
      'Regras de saída JSON:',
      '{"in_scope": boolean, "escalate": boolean, "reply": "texto em português"}',
      '- in_scope=false se a pergunta não for sobre o restaurante',
      '- escalate=true se o cliente estiver irritado ou pedir algo que você não pode resolver',
      '- reply deve ser curto, amigável, usar *negrito* do WhatsApp quando útil',
      '',
      config.description ? `Sobre: ${config.description}` : '',
      config.businessHours ? `Horário: ${config.businessHours}` : '',
      config.address ? `Endereço: ${config.address}` : '',
      `Link delivery: ${config.deliveryMenuUrl}`,
      '',
      'Cardápio (use APENAS estes dados):',
      config.menuSummary,
    ]
      .filter(Boolean)
      .join('\n');

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-6).map((entry) => ({
        role: entry.role,
        content: entry.content,
      })),
      { role: 'user', content: userMessage },
    ];

    try {
      const completion = await this.client.chat.completions.create({
        model: this.env.openAiModel,
        temperature: 0.2,
        max_tokens: 220,
        response_format: { type: 'json_object' },
        messages,
      });

      const raw = completion.choices[0]?.message?.content?.trim();
      if (!raw) {
        return this.fallback(config);
      }

      const parsed = JSON.parse(raw) as Partial<AiStructuredReply>;
      const reply = parsed.reply?.trim();

      if (!reply) {
        return this.fallback(config);
      }

      if (parsed.in_scope === false) {
        return {
          text:
            'Posso ajudar apenas com assuntos do restaurante: cardápio, pedidos, horário e endereço.\n\n' +
            `Digite *cardápio* ou acesse: ${config.deliveryMenuUrl}`,
          escalate: false,
        };
      }

      return {
        text: reply,
        escalate: parsed.escalate === true,
      };
    } catch {
      return this.fallback(config);
    }
  }

  private fallback(config: WhatsAppBotConfigDto): { text: string; escalate: boolean } {
    return {
      text:
        'Desculpe, não consegui processar agora.\n\n' +
        `Digite *cardápio* para ver o menu ou acesse: ${config.deliveryMenuUrl}`,
      escalate: false,
    };
  }
}
