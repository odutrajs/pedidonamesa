import type { proto } from '@whiskeysockets/baileys';
import { ORDER_STATUS_LABELS } from '@pedidonamesa/shared';
import type { WhatsAppBotConfigDto } from '@pedidonamesa/shared';
import type { AiAssistant } from './ai.js';
import type { ApiClient } from './api-client.js';
import type { BotEnv } from './config.js';
import type { ConversationStore } from './conversation-store.js';
import { buildGuardrailReply, evaluateGuardrails } from './guardrails.js';
import { classifyIntent, shouldUseAi } from './intent.js';

export class HandoffStore {
  private readonly until = new Map<string, number>();

  constructor(private readonly minutes: number) {}

  activate(jid: string) {
    this.until.set(jid, Date.now() + this.minutes * 60_000);
  }

  isActive(jid: string) {
    const expiresAt = this.until.get(jid);
    if (!expiresAt) return false;
    if (Date.now() > expiresAt) {
      this.until.delete(jid);
      return false;
    }
    return true;
  }
}

export class MessageHandler {
  constructor(
    private readonly env: BotEnv,
    private readonly api: ApiClient,
    private readonly ai: AiAssistant,
    private readonly handoff: HandoffStore,
    private readonly conversations: ConversationStore,
  ) {}

  async handle(
    jid: string,
    text: string,
    phone: string,
    messageId?: string,
  ): Promise<string | null> {
    const message = text.trim();
    if (!message) return null;

    if (this.conversations.wasMessageProcessed(jid, messageId)) {
      return null;
    }

    this.conversations.markMessageProcessed(jid, messageId);

    if (this.conversations.isDuplicateUserMessage(jid, message)) {
      return null;
    }

    if (this.conversations.isRateLimited(jid)) {
      return 'Recebi muitas mensagens seguidas 😅 Aguarde um instante e me envie novamente, por favor.';
    }

    const config = await this.api.getConfig();

    if (!config.enabled) {
      return 'No momento nosso atendimento automático está desativado. Entre em contato pelo telefone do restaurante.';
    }

    this.conversations.registerUserMessage(jid, message);

    if (config.paused || this.handoff.isActive(jid)) {
      return null;
    }

    if (this.conversations.hasExceededAutoReplyLimit(jid)) {
      this.handoff.activate(jid);
      return (
        '🙋 Para te ajudar melhor, vou encaminhar você para nossa equipe.\n\n' +
        'Um atendente humano continuará em breve.'
      );
    }

    const guardrail = evaluateGuardrails(message);
    if (!guardrail.allowed) {
      if (guardrail.reason === 'frustration') {
        this.handoff.activate(jid);
      }
      return this.finalizeReply(jid, buildGuardrailReply(guardrail.reason, config.deliveryMenuUrl));
    }

    const intent = classifyIntent(message);

    if (intent === 'human_handoff') {
      this.handoff.activate(jid);
      return this.finalizeReply(
        jid,
        '🙋 Claro! Vou encaminhar você para nossa equipe. Aguarde um momento, por favor.',
      );
    }

    if (intent === 'thanks') {
      return this.finalizeReply(
        jid,
        'Por nada! 😊 Se precisar, digite *cardápio*, *pedido*, *horário* ou *endereço*.',
      );
    }

    if (intent === 'menu') {
      this.conversations.resetAutoReplyCounter(jid);
      return this.finalizeReply(jid, this.buildMenuReply(config));
    }

    if (intent === 'order_status') {
      return this.finalizeReply(jid, await this.buildOrderReply(phone));
    }

    if (intent === 'hours') {
      return this.finalizeReply(
        jid,
        config.businessHours
          ? `🕐 *Horário de funcionamento*\n\n${config.businessHours}`
          : 'Ainda não temos o horário cadastrado. Digite *cardápio* para fazer seu pedido online.',
      );
    }

    if (intent === 'address') {
      return this.finalizeReply(
        jid,
        config.address
          ? `📍 *Endereço*\n\n${config.address}`
          : 'Ainda não temos o endereço cadastrado. Digite *cardápio* para ver nosso menu delivery!',
      );
    }

    if (intent === 'greeting') {
      return this.finalizeReply(
        jid,
        `${config.welcomeMessage}\n\n🍽️ Cardápio delivery: ${config.deliveryMenuUrl}`,
      );
    }

    if (shouldUseAi(intent)) {
      if (!this.ai.enabled) {
        return this.finalizeReply(
          jid,
          'Posso te ajudar com *cardápio*, *pedido*, *horário* ou *endereço*.\n\n' +
            `Link: ${config.deliveryMenuUrl}`,
        );
      }

      const history = this.conversations.getHistory(jid).slice(0, -1);
      const aiResult = await this.ai.reply(message, config, history);

      if (aiResult.escalate) {
        this.handoff.activate(jid);
      }

      return this.finalizeReply(jid, aiResult.text);
    }

    return this.finalizeReply(
      jid,
      `Posso ajudar com *cardápio*, *pedido*, *horário* ou *endereço*.\n\n${config.deliveryMenuUrl}`,
    );
  }

  private finalizeReply(jid: string, reply: string): string | null {
    if (this.conversations.shouldBlockRepeatedBotReply(jid, reply)) {
      this.handoff.activate(jid);
      return (
        '🙋 Vou encaminhar você para um atendente humano para continuar da melhor forma.\n\n' +
        'Aguarde um momento, por favor.'
      );
    }

    this.conversations.registerBotReply(jid, reply);
    return reply;
  }

  private buildMenuReply(config: WhatsAppBotConfigDto): string {
    return (
      `🍽️ *Cardápio ${config.restaurantName}*\n\n` +
      `Faça seu pedido pelo link:\n${config.deliveryMenuUrl}\n\n` +
      `*Destaques:*\n${config.menuSummary}`
    );
  }

  private async buildOrderReply(phone: string): Promise<string> {
    const result = await this.api.getLatestOrder(phone);

    if (!result.found || !result.order) {
      return (
        'Não encontrei pedidos recentes com este número.\n\n' +
        'Se ainda não pediu, acesse nosso cardápio digitando *cardápio*.'
      );
    }

    const statusLabel = ORDER_STATUS_LABELS[result.order.status];
    return (
      `📦 *Status do seu pedido*\n\n` +
      `Itens: ${result.order.items}\n` +
      `Total: R$ ${result.order.total.toFixed(2).replace('.', ',')}\n` +
      `Situação: *${statusLabel}*\n\n` +
      `Pedido feito em ${new Date(result.order.createdAt).toLocaleString('pt-BR')}.`
    );
  }
}

export function extractText(message: proto.IMessage): string | null {
  if (message.conversation) return message.conversation;
  if (message.extendedTextMessage?.text) return message.extendedTextMessage.text;
  return null;
}

export function extractPhone(jid: string): string {
  return jid.split('@')[0]?.split(':')[0] ?? jid;
}
