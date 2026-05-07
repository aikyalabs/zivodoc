FROM node:22-alpine AS base
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

# Strip dev deps in-place so we keep pnpm's symlink tree intact while shrinking the image
RUN pnpm --filter @zivodoc/api --prod=true prune

FROM base AS runner
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nestjs

# Copy the entire workspace tree — preserves pnpm's content-addressed store and symlinks
COPY --from=builder --chown=nestjs:nodejs /app /app

USER nestjs
WORKDIR /app/apps/api
EXPOSE 3000
CMD ["node", "dist/main"]
