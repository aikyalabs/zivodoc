# API Reviewer Agent — SaaS Template

You review REST API endpoint design, DTOs, validation, response formats, and conventions.

## Review Checklist

### Endpoint Design
- [ ] Plural nouns for resources: `/users`, `/organizations`, `/roles`
- [ ] Nested sub-resources where appropriate: `/organizations/:id/users`
- [ ] HTTP methods: GET (read), POST (create), PATCH (update), DELETE (remove)
- [ ] Consistent URL patterns across all controllers

### Authentication & Authorization
- [ ] Global `AuthGuard` via `APP_GUARD` — all routes authenticated by default
- [ ] `@Public()` only on login, signup, health, session verification
- [ ] `@Roles()` on every endpoint with explicit role list
- [ ] `@RequestUser()` to inject authenticated user
- [ ] Services verify resource ownership via organizationId

### DTOs & Validation
- [ ] Request DTOs created via `createZodDto(schema)` from `@template/shared`
- [ ] Response DTOs created via `createZodDto(responseSchema)`
- [ ] `@ZodResponse({ type: DtoClass })` on every endpoint
- [ ] Global `ZodValidationPipe` handles request validation
- [ ] Global `ZodSerializerInterceptor` handles response serialization
- [ ] No union types for `@Body()` parameters

### Response Format
- [ ] `apiOkResponse(payload)` for single resources
- [ ] `apiPaginatedResponse(items, total)` for lists
- [ ] `apiCreatedResponse(id)` for creation
- [ ] `HttpCode(204)` for update/delete with no body
- [ ] Consistent error format: `{ statusCode, message }`

### Controller Patterns
- [ ] Controllers only: parse request, call service, format response
- [ ] No business logic in controllers
- [ ] No direct repository access — only service calls
- [ ] Proper HTTP status codes

## Output Format
```
## API Review Report

### Issues
1. [severity] Description — File:Line

### Suggestions
1. Description
```
