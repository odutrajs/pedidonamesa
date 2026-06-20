import { isSimilarReply, normalizeForCompare } from './guardrails.js';

interface SessionState {
  history: Array<{ role: 'user' | 'assistant'; content: string; at: number }>;
  lastUserText: string | null;
  lastUserAt: number;
  lastBotReply: string | null;
  consecutiveBotReplies: number;
  messageTimestamps: number[];
  processedMessageIds: Map<string, number>;
  updatedAt: number;
}

export class ConversationStore {
  private readonly sessions = new Map<string, SessionState>();
  private readonly sessionTtlMs: number;
  private readonly maxHistory: number;
  private readonly maxMessagesPerMinute: number;
  private readonly duplicateWindowMs: number;
  private readonly maxConsecutiveBotReplies: number;

  constructor(options: {
    sessionTtlMs: number;
    maxHistory: number;
    maxMessagesPerMinute: number;
    duplicateWindowMs: number;
    maxConsecutiveBotReplies: number;
  }) {
    this.sessionTtlMs = options.sessionTtlMs;
    this.maxHistory = options.maxHistory;
    this.maxMessagesPerMinute = options.maxMessagesPerMinute;
    this.duplicateWindowMs = options.duplicateWindowMs;
    this.maxConsecutiveBotReplies = options.maxConsecutiveBotReplies;
  }

  private getSession(jid: string): SessionState {
    this.prune();
    const existing = this.sessions.get(jid);
    if (existing) return existing;

    const created: SessionState = {
      history: [],
      lastUserText: null,
      lastUserAt: 0,
      lastBotReply: null,
      consecutiveBotReplies: 0,
      messageTimestamps: [],
      processedMessageIds: new Map(),
      updatedAt: Date.now(),
    };
    this.sessions.set(jid, created);
    return created;
  }

  wasMessageProcessed(jid: string, messageId: string | undefined): boolean {
    if (!messageId) return false;
    const session = this.getSession(jid);
    return session.processedMessageIds.has(messageId);
  }

  markMessageProcessed(jid: string, messageId: string | undefined) {
    if (!messageId) return;
    const session = this.getSession(jid);
    session.processedMessageIds.set(messageId, Date.now());
    session.updatedAt = Date.now();
  }

  isDuplicateUserMessage(jid: string, text: string): boolean {
    const session = this.getSession(jid);
    const normalized = normalizeForCompare(text);
    const lastNormalized = session.lastUserText ? normalizeForCompare(session.lastUserText) : null;
    const withinWindow = Date.now() - session.lastUserAt < this.duplicateWindowMs;
    return withinWindow && normalized === lastNormalized;
  }

  isRateLimited(jid: string): boolean {
    const session = this.getSession(jid);
    const now = Date.now();
    session.messageTimestamps = session.messageTimestamps.filter((timestamp) => now - timestamp < 60_000);
    return session.messageTimestamps.length >= this.maxMessagesPerMinute;
  }

  registerUserMessage(jid: string, text: string) {
    const session = this.getSession(jid);
    const now = Date.now();
    session.lastUserText = text;
    session.lastUserAt = now;
    session.messageTimestamps.push(now);
    session.history.push({ role: 'user', content: text, at: now });
    session.history = session.history.slice(-this.maxHistory);
    session.updatedAt = now;
  }

  getHistory(jid: string): Array<{ role: 'user' | 'assistant'; content: string }> {
    return this.getSession(jid).history.map(({ role, content }) => ({ role, content }));
  }

  shouldBlockRepeatedBotReply(jid: string, reply: string): boolean {
    const session = this.getSession(jid);
    if (!session.lastBotReply) return false;
    return isSimilarReply(session.lastBotReply, reply);
  }

  hasExceededAutoReplyLimit(jid: string): boolean {
    return this.getSession(jid).consecutiveBotReplies >= this.maxConsecutiveBotReplies;
  }

  registerBotReply(jid: string, reply: string) {
    const session = this.getSession(jid);
    session.lastBotReply = reply;
    session.consecutiveBotReplies += 1;
    session.history.push({ role: 'assistant', content: reply, at: Date.now() });
    session.history = session.history.slice(-this.maxHistory);
    session.updatedAt = Date.now();
  }

  resetAutoReplyCounter(jid: string) {
    const session = this.getSession(jid);
    session.consecutiveBotReplies = 0;
    session.updatedAt = Date.now();
  }

  clearSession(jid: string) {
    this.sessions.delete(jid);
  }

  private prune() {
    const cutoff = Date.now() - this.sessionTtlMs;
    for (const [jid, session] of this.sessions.entries()) {
      if (session.updatedAt < cutoff) {
        this.sessions.delete(jid);
        continue;
      }

      for (const [messageId, timestamp] of session.processedMessageIds.entries()) {
        if (timestamp < cutoff) {
          session.processedMessageIds.delete(messageId);
        }
      }
    }
  }
}
