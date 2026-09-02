FROM node:20-alpine AS builder

RUN npm install -g pnpm

WORKDIR /usr/src/app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

RUN pnpm install --frozen-lockfile

COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

RUN pnpm --filter @ratehub/shared build
WORKDIR /usr/src/app/apps/api
RUN pnpm prisma generate
RUN pnpm build

FROM node:20-alpine AS runner

RUN npm install -g pnpm

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/package.json ./
COPY --from=builder /usr/src/app/pnpm-workspace.yaml ./
COPY --from=builder /usr/src/app/packages/shared ./packages/shared
COPY --from=builder /usr/src/app/apps/api/package.json ./apps/api/
COPY --from=builder /usr/src/app/apps/api/dist ./apps/api/dist
COPY --from=builder /usr/src/app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/apps/api/node_modules ./apps/api/node_modules

WORKDIR /usr/src/app/apps/api

EXPOSE 3000

CMD ["node", "dist/main"]
