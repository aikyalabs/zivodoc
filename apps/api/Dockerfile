FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.12.1 --activate
WORKDIR /app

# Build everything in a workspace-aware stage
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

# pnpm deploy produces a self-contained dir with all prod deps flattened (no symlinks,
# no workspace hoisting weirdness). This is the right Docker pattern for pnpm workspaces.
RUN pnpm --filter @zivodoc/api deploy --prod --legacy /deploy/api

FROM node:22-alpine AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nestjs

COPY --from=builder --chown=nestjs:nodejs /deploy/api ./
USER nestjs
EXPOSE 3000
CMD ["node", "dist/main"]
