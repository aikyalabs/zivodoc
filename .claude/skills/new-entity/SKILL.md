---
name: new-entity
description: Full-stack entity scaffolding — creates shared schemas, API module (entity, repository, service, controller, dto), and frontend page (route, hooks) in one go.
user-invocable: true
argument-hint: "[entity-name]"
---

# Full-Stack Entity Scaffolding

Create a complete end-to-end entity for `$ARGUMENTS` across all three packages.

This skill orchestrates three individual skills in sequence:
1. **Shared schemas** (`/new-schema`)
2. **API module** (`/new-module`)
3. **Frontend page** (`/new-page`)

## Step 1: Gather Requirements

Ask the user for ALL details upfront:

**Entity basics:**
- Entity name (singular, e.g., `invoice`)
- ULID prefix (e.g., `inv`)
- Whether it needs soft-delete

**Fields:**
- List of fields with types
- Required vs optional
- Unique constraints
- New enum values needed

**Relations:**
- Parent entities (foreign keys)
- Child entities

**Access control:**
- Which roles can CRUD

**Frontend:**
- List page, detail page, create form needed?
- Sidebar placement

## Step 2: Create Shared Schemas

Follow `/new-schema` pattern. Create:
```
packages/shared/src/schemas/{entity}/
├── {entity}Schema.ts
├── {entity}RequestSchema.ts
├── {entity}ResponseSchema.ts
└── index.ts
```

Register in `packages/shared/src/schemas/index.ts`.
Build: `pnpm --filter @zivodoc/shared build`

## Step 3: Create API Module

Follow `/new-module` pattern. Create:

**Database layer:**
```
apps/api/src/database/entities/{entity}.entity.ts
apps/api/src/database/repositories/{entity}.repository.ts
```

Register in `database/entities/index.ts`, `database/repositories/index.ts`, and `database/db.module.ts`.

**Feature module:**
```
apps/api/src/{entities}/
├── {entities}.module.ts
├── {entities}.controller.ts
├── {entities}.service.ts
└── {entities}.dto.ts
```

Register in `apps/api/src/app.module.ts`.

## Step 4: Create Migration

Generate a TypeORM migration for the new entity:
```bash
pnpm --filter @zivodoc/api migration:generate src/database/migrations/Add{Entity}Table
```

## Step 5: Create Frontend

Follow `/new-page` pattern. Create:
- Route file in `apps/web/src/routes/_authentication/`
- Query hooks in `apps/web/src/hooks/queries/`
- Mutation hooks in `apps/web/src/hooks/mutations/`
- Add sidebar link

## Step 6: Verify

1. `pnpm --filter @zivodoc/shared build` — shared compiles
2. `pnpm --filter @zivodoc/api build` — API compiles (0 issues)
3. `pnpm --filter @zivodoc/web build` — web compiles
4. Full flow: create → list → view → edit → delete

## Checklist

- [ ] Shared schemas created and exported
- [ ] Enums created (if needed) and exported
- [ ] Shared package builds
- [ ] TypeORM entity with ULID prefix, timestamps, relations
- [ ] Repository extends TypeORM Repository
- [ ] Service with CRUD + organizationId checks
- [ ] Controller with roles, DTOs, response helpers
- [ ] DTOs wrap shared schemas via createZodDto()
- [ ] Module registered in AppModule
- [ ] Entity/repo registered in DatabaseModule
- [ ] Migration generated
- [ ] Frontend route created
- [ ] Query and mutation hooks created
- [ ] Sidebar updated
