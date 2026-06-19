FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @pedidonamesa/shared build
RUN pnpm --filter @pedidonamesa/api build
RUN pnpm deploy --filter @pedidonamesa/api --prod /prod/api

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /prod/api /app
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/main.js"]
