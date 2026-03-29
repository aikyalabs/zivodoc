# SaaS Template

Production-ready SaaS monorepo template with auth, RBAC, multi-tenancy, and full-stack type safety.

## Architecture

```
saas-template/
├── apps/api/        NestJS 11 + Express + TypeORM + PostgreSQL 17
├── apps/web/        React 19 + TanStack Router + TanStack Query + Tailwind CSS 4
├── packages/shared/ Zod schemas, enums, API response types (@template/shared)
```

## Tech Stack
- **API**: NestJS 11, Express, TypeORM 0.3, PostgreSQL 17, Zod, bcrypt, nestjs-zod
- **Frontend**: React 19, TanStack Router 1, TanStack Query 5, Radix UI, Tailwind CSS 4, Axios
- **Shared**: Zod, tsup (ESM + CJS dual build)
- **Testing**: Jest 30 (API e2e), Vitest (frontend)
- **Package Manager**: pnpm 10 with workspaces + Turborepo v2

## Commands

```bash
# Development
docker compose up -d                    # Start PostgreSQL + Redis + MinIO
pnpm install                            # Install all dependencies
pnpm build                              # Build all packages (shared → api + web)
pnpm dev                                # Start all apps in dev mode

# Per-app
pnpm --filter @template/api dev         # API on :3000
pnpm --filter @template/web dev         # Web on :5173

# Database (TypeORM migrations)
pnpm --filter @template/api migration:generate src/database/migrations/MyMigration
pnpm --filter @template/api migration:run
pnpm --filter @template/api migration:revert

# Seed
pnpm --filter @template/api seed        # Creates admin + owner + default org

# Testing
pnpm --filter @template/api test:e2e    # API e2e tests
pnpm --filter @template/web test        # Frontend tests

# Linting
pnpm lint                               # Lint all
pnpm format                             # Format all
```

## Database

TypeORM with PostgreSQL. Entities in `apps/api/src/database/entities/`, repositories in `apps/api/src/database/repositories/`.

The `DatabaseModule` is `@Global()` — all repositories are available via DI without importing in feature modules.

### Entity pattern
- All entities extend `BaseEntity` which provides ULID `id`, `createdAt`, `updatedAt`
- Use `@BeforeInsert()` to auto-generate prefixed ULID IDs
- Soft-deletable entities use `@DeleteDateColumn()`

### Repository pattern
- Repositories extend TypeORM's `Repository<Entity>` and are `@Injectable()`
- Use `@InjectRepository(Entity)` in constructor
- Custom query methods go on the repository class

## RBAC — 3-Role Model

| Role | Scope | Purpose |
|------|-------|---------|
| `admin` | Platform | Not tied to any org. Full platform access. Bypasses all role/permission checks in auth guard. |
| `owner` | Organization | Owns/manages their org and its users. Can create users, manage roles. |
| `member` | Organization | Regular org user with limited access. |

- Platform role is stored on `UserEntity.role` (typed as `UserRole` enum: `'admin' | 'owner' | 'member'`)
- Granular permissions are stored on `RoleEntity.permissions` (JSONB) and linked to users via `UserEntity.roleId`
- Auth guard: admins return `true` immediately, then `@Roles()` checks platform role, then `@RequirePermissions()` checks the user's assigned `RoleEntity` permissions by `roleId`
- Seed users: `admin@example.com` (admin, no org) / `owner@example.com` (owner, default-org)

### Caller pattern
Services receive a `Caller` object (`{ id, role, organizationId }`) and handle all authorization/scoping internally. Controllers are thin — they extract the user from `@RequestUser()` and delegate to services.

```ts
// Controller (thin)
async findAll(@RequestUser() user: AuthUser) {
  return this.usersService.list(user, pagination);
}

// Service (all logic here)
async list(caller: Caller, options?) {
  const where = isAdmin(caller) ? {} : { organizationId: caller.organizationId! };
  // ...
}
```

## Conventions
- All entities use ULID IDs with prefixes (`user_`, `org_`, `role_`)
- API response envelope: `{ payload, meta? }` for success, `{ statusCode, message }` for errors
- Zod schemas defined once in shared, used in both API (createZodDto) and frontend (form validation)
- Response schemas use `z.strictObject()` — extra fields cause 500, keep schemas in sync with entities
- DB-backed sessions with Bearer token auth (no JWT)
- Multi-tenancy via organizationId on all tenant-scoped entities
- RBAC with platform roles (`admin`/`owner`/`member`) + granular permissions JSONB via `roleId`
- Atomic component design: atoms → molecules → organisms → templates → pages
- Use `Select` component (Radix UI) for form selects, `DropdownMenu` only for action menus
- TanStack Router: use `settings.index.tsx` for index routes when nested routes exist (not `settings.tsx`, which becomes a layout)

## Available Agents

| Agent | Purpose | When to Use |
|-------|---------|-------------|
| `code-review` | Enforce all development rules | After writing code, before PR |
| `test-writer` | Generate tests matching project patterns | After implementing features |
| `security-audit` | Scan for OWASP vulnerabilities | Before deployments, periodic audits |
| `db-reviewer` | Review entities, migrations, queries | When changing database |
| `api-reviewer` | Validate endpoint design & DTOs | When creating/modifying API endpoints |
| `frontend-reviewer` | Review React/TanStack patterns | When working on frontend |
| `architecture-guard` | Enforce layer boundaries & module structure | When adding modules or cross-cutting changes |
| `pr-reviewer` | Comprehensive PR review | Before merging any PR |
| `performance-analyzer` | Detect N+1, missing indexes, bundle issues | When optimizing |
| `pre-commit` | Validate before committing | Before every commit |

## Available Skills

| Skill | Purpose |
|-------|---------|
| `/new-entity` | Full-stack scaffolding: shared schemas + API module + frontend page |
| `/new-module` | Scaffold NestJS API module with TypeORM entity/repo/service/controller |
| `/new-page` | Scaffold frontend page with TanStack Router route + hooks |
| `/new-schema` | Create Zod schema set in shared package |
