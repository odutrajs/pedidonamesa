import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import type { Logger } from 'pino';
import type { BotEnv } from './config.js';
import { connectionStatus } from './status.js';

type LogoutHandler = () => Promise<void>;

function sendJson(res: ServerResponse, statusCode: number, body: unknown) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

function isAuthorized(req: IncomingMessage, apiKey: string | null): boolean {
  if (!apiKey) return true;
  const header = req.headers.authorization;
  return header === `Bearer ${apiKey}`;
}

export function startHttpServer(env: BotEnv, logger: Logger, onLogout: LogoutHandler) {
  const port = env.httpPort;
  const apiKey = env.apiKey;

  const server = createServer(async (req, res) => {
    if (!isAuthorized(req, apiKey)) {
      sendJson(res, 401, { message: 'Unauthorized' });
      return;
    }

    const url = req.url ?? '/';

    if (req.method === 'GET' && url === '/health') {
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === 'GET' && url === '/status') {
      sendJson(res, 200, connectionStatus.get());
      return;
    }

    if (req.method === 'POST' && url === '/session/logout') {
      try {
        await onLogout();
        sendJson(res, 200, { ok: true, ...connectionStatus.get() });
      } catch (error) {
        logger.error({ error }, 'Logout failed');
        sendJson(res, 500, { message: 'Failed to logout WhatsApp session' });
      }
      return;
    }

    sendJson(res, 404, { message: 'Not found' });
  });

  server.listen(port, '0.0.0.0', () => {
    logger.info({ port }, 'WhatsApp bot HTTP server listening');
  });

  return server;
}
