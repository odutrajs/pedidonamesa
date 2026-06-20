# WhatsApp Bot (Baileys)

Assistente virtual para WhatsApp, **desacoplado** do `docker-compose.yaml` principal. Roda em compose próprio para não cair quando o deploy da Hostinger reinicia api/web/nginx.

## Funcionalidades

Inspirado em soluções como Anota AI, ObaZap e MeuCardápio:

- Boas-vindas automáticas
- Envio do link do cardápio delivery
- Resumo do cardápio por categoria
- Status do último pedido (por telefone)
- Horário e endereço configuráveis no admin
- Pausar bot / atendimento humano
- IA (OpenAI) para dúvidas gerais — opcional

## Configuração no admin

Admin → **WhatsApp**: ativar bot, pausar, mensagem de boas-vindas, horário e endereço.

## Desenvolvimento local

```bash
cp .env.whatsapp.example .env.whatsapp
# Edite RESTAURANT_SLUG, API_BASE_URL e WHATSAPP_BOT_API_KEY

# Na API (apps/api/.env):
# WHATSAPP_BOT_SERVICE_URL=http://localhost:3001
# WHATSAPP_BOT_API_KEY=mesma-chave-do-bot

pnpm install
pnpm --filter @pedidonamesa/whatsapp-bot dev
```

Abra **Admin → WhatsApp** para escanear o QR code (atualiza a cada 3 segundos).

## Produção (servidor separado)

```bash
cp .env.whatsapp.example .env.whatsapp
# API_BASE_URL=https://cardapionamesa.com
# RESTAURANT_SLUG=slug-do-restaurante
# WHATSAPP_BOT_API_KEY=chave-segura

docker compose -f docker-compose.whatsapp.yaml up -d --build
```

Na API (`.env` do deploy principal):

```
WHATSAPP_BOT_SERVICE_URL=http://whatsapp-bot:3001
WHATSAPP_BOT_API_KEY=mesma-chave-segura
```

O bot entra na rede Docker `pedidonamesa_default` (mesma da API) — sem expor porta no host.

O volume `whatsapp_auth` guarda a sessão Baileys — **não apague** após conectar, senão precisará escanear QR de novo.

## Variáveis

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `RESTAURANT_SLUG` | Sim | Slug do restaurante |
| `API_BASE_URL` | Sim | URL base da API (sem `/api`) |
| `OPENAI_API_KEY` | Não | Habilita IA para perguntas livres |
| `BAILEYS_AUTH_DIR` | Não | Pasta da sessão (default: `./auth`) |

## API usada pelo bot

- `GET /api/bot/:slug/config`
- `GET /api/bot/:slug/orders/latest?phone=`

## Palavras-chave

- `cardápio`, `menu` → link + destaques
- `pedido`, `status` → último pedido do número
- `horário` → horário cadastrado
- `endereço` → endereço cadastrado
- `atendente` → handoff humano (bot para de responder por 30 min)

## IA e guardrails

Pipeline em camadas (controle fora do prompt):

1. **Intenção determinística** — cardápio, pedido, horário, endereço, atendente
2. **Guardrails** — bloqueia prompt injection, off-topic e frustração
3. **OpenAI** — só dúvidas sobre cardápio/restaurante (JSON estruturado)
4. **Anti-loop** — deduplica mensagens, rate limit, bloqueia respostas repetidas, handoff após 5 respostas

Controles em `.env.whatsapp`: `MAX_MESSAGES_PER_MINUTE`, `DUPLICATE_MESSAGE_WINDOW_MS`, `MAX_CONSECUTIVE_BOT_REPLIES`, `MAX_CONVERSATION_HISTORY`.
