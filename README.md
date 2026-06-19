# Pedido na Mesa

Sistema de pedidos por mesa com cardápio digital, cozinha em tempo real e painel admin.

## Fluxo do negócio

1. **Admin** cria categorias, produtos e mesas (cada mesa tem um token/QR único)
2. **Cliente** escaneia QR → `/mesa/{token}` → monta pedido e envia
3. **Cozinha** recebe pedido em tempo real na tela `/cozinha` (com som)
4. Cozinha marca itens: preparar → pronto → entregue
5. Pedido sai da cozinha quando entregue ou cancelado

## Stack

- **Monorepo** (pnpm workspaces)
- **API**: NestJS + TypeORM + PostgreSQL + Socket.io
- **Web**: Vite + React + Tailwind
- **Infra**: PostgreSQL, Redis (futuro BullMQ), MinIO

## Estrutura

```
apps/
  api/     NestJS backend
  web/     Vite frontend
packages/
  shared/  Types, enums, eventos WebSocket
infra/
  docker-compose.yml
```

## Setup local

### 1. Infra (Docker)

```bash
pnpm docker:up
```

### 2. Dependências

```bash
corepack enable
pnpm install
```

### 3. Variáveis de ambiente

```bash
cp infra/.env.example apps/api/.env
```

### 4. Seed (dados demo)

```bash
pnpm --filter @pedidonamesa/api seed
```

O seed cria:
- Admin: `admin@demo.com` / `admin123`
- Cozinha: `cozinha@demo.com` / `admin123`
- Mesas com cardápio demo

### 5. Rodar

```bash
pnpm dev
```

- Web: http://localhost:5173
- API: http://localhost:3000/api
- MinIO console: http://localhost:9001 (minioadmin/minioadmin)

## Rotas do frontend

| Rota | Quem usa |
|------|----------|
| `/mesa/{token}` | Cliente na mesa (QR) |
| `/cozinha` | Cozinha (login) |
| `/admin` | Administrador |
| `/login` | Staff |

## API principal

| Endpoint | Descrição |
|----------|-----------|
| `GET /api/menu/mesa/:token` | Cardápio da mesa |
| `POST /api/orders/mesa/:token` | Cliente cria pedido |
| `GET /api/orders/kitchen` | Pedidos ativos na cozinha |
| `PATCH /api/orders/:id/status` | Atualiza status do pedido |
| `PATCH /api/orders/items/:itemId/status` | Atualiza item |
| `POST /api/auth/login` | Login staff |
| `GET/POST /api/admin/*` | CRUD admin |

## WebSocket

Namespace: `/orders` — eventos: `order:created`, `order:updated`, `order:item:updated`

Autenticação via JWT no handshake (`auth.token`).

## Deploy Hostinger VPS

Deploy automático via GitHub Actions (`.github/workflows/docker.yml`):

1. Push em `main`/`master` → build das imagens no GHCR
2. Se o build passar → deploy no VPS Hostinger (pull + restart dos containers)
3. A pipeline aguarda o deploy terminar na Hostinger e valida se api, web e nginx estão rodando

### Configurar no GitHub (uma vez)

Em **Settings → Secrets and variables → Actions**:

| Tipo | Nome | Valor |
|------|------|-------|
| Secret | `HOSTINGER_API_KEY` | API key do [hPanel → API](https://hpanel.hostinger.com/profile/api) |
| Variable | `HOSTINGER_VM_ID` | ID do VPS (ex.: `1769902` — número do hostname `srv1769902.hstgr.cloud`) |

As variáveis de ambiente de produção (`JWT_SECRET`, `DB_PASSWORD`, etc.) ficam no Docker Manager da Hostinger e são preservadas nos deploys.

## Próximos passos

- [ ] BullMQ worker (notificações, relatórios)
- [x] Upload de imagens de produto via MinIO
- [ ] Tela do garçom (pedidos prontos para entregar)
- [ ] Multi-tenant (vários restaurantes)
- [ ] Pagamento integrado
