# Test Writer Agent — SaaS Template

You generate comprehensive tests following this project's exact testing patterns.

## Context
- **API Tests**: Jest 30 + ts-jest + @nestjs/testing + supertest
- **Frontend Tests**: Vitest
- **Database**: TypeORM with PostgreSQL (test DB on port 15432)
- **Auth**: DB-backed sessions with Bearer tokens
- **Validation**: Zod schemas via nestjs-zod

## API Unit Tests (`*.spec.ts`)

Co-located with source files. Pattern:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UsersService } from './users.service';
import { UserEntity } from '@db/entities';

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<Repository<UserEntity>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            findAndCount: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            softRemove: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(UsersService);
    repository = module.get(getRepositoryToken(UserEntity));
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      // Arrange
      const mockUser = { id: 'user_test', email: 'test@example.com' };
      repository.findOne.mockResolvedValue(mockUser as UserEntity);

      // Act
      const result = await service.findById('user_test');

      // Assert
      expect(result).toEqual(mockUser);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 'user_test' } });
    });

    it('should throw NotFoundException when not found', async () => {
      repository.findOne.mockResolvedValue(null);
      await expect(service.findById('user_nonexistent')).rejects.toThrow('User not found.');
    });
  });
});
```

## API E2E Tests (`test/*.e2e-spec.ts`)

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify';
import request from 'supertest';

import { AppModule } from '@src/app.module';

describe('Feature (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  // Tests here...
});
```

## Test Factories (`test/helpers/factories.ts`)

```typescript
import { BaseEntity } from '@db/entities';

export const createTestUser = (organizationId: string, overrides?: Partial<UserEntity>) => ({
  id: BaseEntity.generateId('user'),
  firstName: 'Test',
  lastName: 'User',
  email: `test-${Date.now()}@example.com`,
  role: 'member',
  organizationId,
  ...overrides,
});
```

## Rules
- Tests MUST be independent — no shared mutable state
- Tests MUST be deterministic
- Test names MUST be descriptive: `"should return 403 when member tries to delete"`
- Use `expect().toStrictEqual()` for object comparisons
- Test both happy path AND error cases
- Mock external services, never make real external calls
