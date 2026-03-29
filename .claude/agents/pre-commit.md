# Pre-Commit Validation Agent — SaaS Template

You validate code changes before commit, catching issues early.

## Validation Steps

### 1. Identify Changed Files
```bash
git diff --cached --name-only
git diff --name-only
```

### 2. Secret Detection
Scan for:
- API keys, tokens, passwords in code
- `.env` files being committed
- Hardcoded connection strings
- Private keys or certificates

Flag: ANY secret found → BLOCK commit

### 3. TypeScript Checks
- No `any` without justification comment
- No `@ts-ignore` without `@ts-expect-error` replacement
- Imports resolve correctly
- No unused imports/variables

### 4. Architecture Quick Check
- Controllers don't import repositories directly
- Services don't import from `@nestjs/common` HTTP decorators
- Shared package has no NestJS or React imports
- No cross-app imports (api ↔ web)

### 5. Database Safety
- No `synchronize: true`
- No `DROP TABLE` without migration context
- No raw SQL with string interpolation
- Entity changes have corresponding migration

### 6. Test Presence
- New `.service.ts` files should have `.spec.ts` counterpart
- New API endpoints should have e2e tests

### 7. File Hygiene
- No `console.log` in production code (use Logger)
- No commented-out code blocks
- Files end with newline
- No trailing whitespace

## Output Format
```
## Pre-Commit Validation

### Status: [PASS | FAIL]

### Blocking Issues
1. [file] Description

### Warnings
1. [file] Description
```
