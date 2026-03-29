---
name: new-module
description: Scaffold a complete NestJS API module with TypeORM entity, repository, service, controller, and DTOs following exact project patterns.
user-invocable: true
argument-hint: "[entity-name]"
---

# Scaffold a New API Module

Create a complete NestJS feature module for `$ARGUMENTS`.

## Step 1: Determine Entity Details

Ask the user (if not provided):
1. Entity name (singular, e.g., `invoice`, `product`)
2. Key fields (besides id, timestamps)
3. Whether it needs soft-delete (`@DeleteDateColumn()`)
4. Relations to other entities
5. Which roles can access it (owner, admin, member)
6. ULID prefix (e.g., `inv`, `prod`)

## Step 2: Create Entity

Create `apps/api/src/database/entities/{entity}.entity.ts`:

```typescript
import { Entity, Column, ManyToOne, JoinColumn, Index, BeforeInsert } from 'typeorm';
import { BaseEntity } from './base.entity';
import { OrganizationEntity } from './organization.entity';

@Entity('{entities}')
export class {Entity}Entity extends BaseEntity {
  @BeforeInsert()
  generateId() {
    if (!this.id) this.id = BaseEntity.generateId('{prefix}');
  }

  @Column({ type: 'varchar', length: 200, nullable: false })
  name!: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  organizationId!: string;

  @ManyToOne(() => OrganizationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization!: OrganizationEntity;
}
```

Register in `database/entities/index.ts`.

## Step 3: Create Repository

Create `apps/api/src/database/repositories/{entity}.repository.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { {Entity}Entity } from '../entities/{entity}.entity';

@Injectable()
export class {Entity}Repository extends Repository<{Entity}Entity> {
  constructor(
    @InjectRepository({Entity}Entity)
    repository: Repository<{Entity}Entity>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }
}
```

Register in `database/repositories/index.ts`.

## Step 4: Register in DatabaseModule

Add entity to `entities` array and repository to `repositories` array in `database/db.module.ts`.

## Step 5: Create Service

Create `apps/api/src/{entities}/{entities}.service.ts` with CRUD methods using the repository.

## Step 6: Create DTOs

Create `apps/api/src/{entities}/{entities}.dto.ts`:
```typescript
import { createZodDto } from 'nestjs-zod';
import { create{Entity}Schema, {entity}ResponseSchema, {entities}ResponseSchema } from '@template/shared';

export class Create{Entity}Request extends createZodDto(create{Entity}Schema) {}
export class {Entity}Response extends createZodDto({entity}ResponseSchema) {}
export class {Entities}Response extends createZodDto({entities}ResponseSchema) {}
```

## Step 7: Create Controller

Create `apps/api/src/{entities}/{entities}.controller.ts` with standard CRUD endpoints using response helpers.

## Step 8: Create Module

Create `apps/api/src/{entities}/{entities}.module.ts` and register in `app.module.ts`.

## Step 9: Create Shared Schemas

Use `/new-schema` skill to create schemas in the shared package.

## Step 10: Verify

- `pnpm --filter @template/shared build`
- `pnpm --filter @template/api build`
- No TypeScript errors
