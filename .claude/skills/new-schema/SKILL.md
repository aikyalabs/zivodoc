---
name: new-schema
description: Create a new Zod schema set in the shared package for an API entity, following the template's exact schema patterns (strictObject, nonemptystring, buildOkResponse, etc).
user-invocable: true
argument-hint: "[entity-name]"
---

# Create a New Shared Zod Schema

Create a complete schema set for `$ARGUMENTS` in the shared package.

## Step 1: Determine Schema Fields

Ask the user (if not provided):
1. Entity name
2. Fields with types (string, number, boolean, enum, date, relation ID)
3. Which fields are required for creation vs optional for editing
4. Which fields appear in responses
5. Any enum values needed

## Step 2: Create Schema Files

Generate in `packages/shared/src/schemas/{entityName}/` (camelCase directory):

### 2.1 Base Schema (`{entityName}Schema.ts`)

```typescript
import { z } from 'zod';
import { nonemptystring } from '../nonemptystring';
import { timestamp } from '../timestamp';

export const {entity}ModelSchema = z.strictObject({
  id: z.string(),
  name: z.string(),
  // Add all model fields
  createdAt: timestamp,
  updatedAt: timestamp,
});
```

**Rules:**
- Always use `z.strictObject()` — never `z.object()`
- Use `nonemptystring` for required strings (trims + min 1)
- Use `optionalstring` for optional strings (trims, '' → undefined)
- Use `timestamp` for dates
- Import enums from `shared/src/enums/` and use `z.enum()`

### 2.2 Request Schema (`{entityName}RequestSchema.ts`)

```typescript
import { z } from 'zod';
import { nonemptystring } from '../nonemptystring';

export const create{Entity}Schema = z.strictObject({
  name: nonemptystring,
});

export const update{Entity}Schema = z.strictObject({
  name: nonemptystring.optional(),
});
```

### 2.3 Response Schema (`{entityName}ResponseSchema.ts`)

```typescript
import { buildOkResponse } from '../ApiOkResponse';
import { buildPaginatedResponse } from '../ApiPaginatedResponse';
import { {entity}ModelSchema } from './{entityName}Schema';

export const {entity}ResponseSchema = buildOkResponse({entity}ModelSchema);
export const {entities}ResponseSchema = buildPaginatedResponse({entity}ModelSchema);
```

### 2.4 Index (`index.ts`)

```typescript
export * from './{entityName}Schema';
export * from './{entityName}RequestSchema';
export * from './{entityName}ResponseSchema';
```

## Step 3: Register Exports

Add to `packages/shared/src/schemas/index.ts`:
```typescript
export * from './{entityName}';
```

## Step 4: Create Enum (if needed)

```typescript
import { Enum, isEnumType } from '../utils/enumType';

export const {EnumName} = ['value1', 'value2'] as const;
export type {EnumName} = Enum<typeof {EnumName}>;
export const is{EnumName} = isEnumType({EnumName});
```

Add to `packages/shared/src/enums/index.ts`.

## Step 5: Build & Verify

Run `pnpm --filter @template/shared build` to compile and verify no type errors.
