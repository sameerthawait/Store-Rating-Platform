FROM node:20-alpine AS builder

RUN npm install -g pnpm

WORKDIR /usr/src/app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

RUN pnpm install --frozen-lockfile

COPY packages/shared ./packages/shared
COPY apps/web ./apps/web

RUN pnpm --filter @ratehub/shared build
WORKDIR /usr/src/app/apps/web
RUN pnpm build

FROM nginx:alpine AS runner

COPY --from=builder /usr/src/app/apps/web/dist /usr/share/nginx/html
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
