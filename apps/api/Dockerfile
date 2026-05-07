FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.12.1 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
COPY packages/scanner/package.json packages/scanner/
RUN pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/packages/scanner/node_modules ./packages/scanner/node_modules
COPY . .
RUN pnpm --filter @zivodoc/shared build
RUN pnpm --filter @zivodoc/scanner build
RUN pnpm --filter @zivodoc/api build

FROM node:22-alpine AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nestjs

COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/node_modules ./node_modules
COPY --from=builder /app/apps/api/package.json ./

# Linked workspace packages — TypeORM and runtime imports resolve via these
COPY --from=builder /app/packages/shared/dist ./node_modules/@zivodoc/shared/dist
COPY --from=builder /app/packages/shared/package.json ./node_modules/@zivodoc/shared/package.json
COPY --from=builder /app/packages/scanner/dist ./node_modules/@zivodoc/scanner/dist
COPY --from=builder /app/packages/scanner/package.json ./node_modules/@zivodoc/scanner/package.json
COPY --from=builder /app/packages/scanner/node_modules ./node_modules/@zivodoc/scanner/node_modules

USER nestjs
EXPOSE 3000
CMD ["node", "dist/main"]
