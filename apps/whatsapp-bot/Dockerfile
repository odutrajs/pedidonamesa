FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json packages/shared/
COPY apps/whatsapp-bot/package.json apps/whatsapp-bot/

RUN pnpm install --frozen-lockfile

COPY packages/shared packages/shared
COPY apps/whatsapp-bot apps/whatsapp-bot

RUN pnpm --filter @pedidonamesa/shared build
RUN pnpm --filter @pedidonamesa/whatsapp-bot build

FROM node:22-alpine

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json packages/shared/
COPY apps/whatsapp-bot/package.json apps/whatsapp-bot/

RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/packages/shared/dist packages/shared/dist
COPY --from=builder /app/apps/whatsapp-bot/dist apps/whatsapp-bot/dist

ENV NODE_ENV=production
WORKDIR /app/apps/whatsapp-bot

CMD ["node", "dist/index.js"]
