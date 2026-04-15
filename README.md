# SaaS Template

A production-ready monorepo template for SaaS applications with authentication, RBAC, multi-tenancy, and full-stack type safety.

## Quick Start

```bash
# Prerequisites: Node.js 22+, pnpm 10+, Docker

# 1. Start infrastructure
docker compose up -d

# 2. Install dependencies
pnpm install

# 3. Build shared package
pnpm --filter @zivodoc/shared build

# 4. Run database migrations
pnpm --filter @zivodoc/api drizzle:migrate

# 5. Start development
pnpm dev
```

- API: http://localhost:3000
- Web: http://localhost:5173
- MinIO Console: http://localhost:9001

## Stack

| Layer | Technology |
|-------|-----------|
| Backend | NestJS 11, Fastify 5, Drizzle ORM, PostgreSQL 17 |
| Frontend | React 19, Vite 7, TanStack Router/Query/Form |
| UI | shadcn/ui, Radix UI, Tailwind CSS 4 |
| Auth | DB-backed sessions, Bearer tokens |
| Shared | Zod schemas, tsup builds |
| Testing | Jest 30 (API), Vitest 4 (Frontend) |
| DevOps | Docker Compose, GitHub Actions, Turborepo |
