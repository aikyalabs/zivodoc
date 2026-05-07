FROM node:22-slim AS base
RUN corepack enable && corepack prepare pnpm@10.12.1 --activate
WORKDIR /app

FROM base AS builder
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
COPY packages/scanner/package.json packages/scanner/
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm --filter @zivodoc/shared build
RUN pnpm --filter @zivodoc/scanner build
RUN pnpm --filter @zivodoc/api build

FROM base AS runner
RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid nodejs nestjs

# Copy the entire workspace tree — preserves pnpm's content-addressed store and symlinks
COPY --from=builder --chown=nestjs:nodejs /app /app

USER nestjs
WORKDIR /app/apps/api
EXPOSE 3000
CMD ["node", "dist/main"]
