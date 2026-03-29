---
name: template-conventions
description: SaaS template project conventions and patterns reference. Auto-loaded when writing code to ensure all new code matches established patterns.
user-invocable: false
---

# Template Conventions Reference

Quick reference for exact coding patterns used in this SaaS template.

## API Response Helpers

From `apps/api/src/api-response.helper.ts`:
```typescript
return apiOkResponse(item);
return apiOkResponse(item, 'Updated successfully');
return apiPaginatedResponse(items, total);
return apiCreatedResponse(id);
return apiErrorResponse(400, 'Invalid request');
```

## TypeORM Entity Pattern

```typescript
import { Entity, Column, ManyToOne, JoinColumn, BeforeInsert } from 'typeorm';
import { BaseEntity } from './base.entity';
import { OrganizationEntity } from './organization.entity';

@Entity('entities')
export class EntityName extends BaseEntity {
  @BeforeInsert()
  generateId() {
    if (!this.id) this.id = BaseEntity.generateId('prefix');
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

## Repository Pattern

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MyEntity } from '../entities/my.entity';

@Injectable()
export class MyRepository extends Repository<MyEntity> {
  constructor(
    @InjectRepository(MyEntity)
    repository: Repository<MyEntity>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  async findByOrganizationId(orgId: string): Promise<MyEntity[]> {
    return this.find({ where: { organizationId: orgId }, order: { createdAt: 'DESC' } });
  }
}
```

## Service Pattern

```typescript
@Injectable()
export class MyService {
  constructor(private readonly myRepository: MyRepository) {}

  async findById(id: string) {
    const item = await this.myRepository.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Not found.');
    return item;
  }

  async list(orgId: string, opts?: { limit?: number; offset?: number }): Promise<[unknown[], number]> {
    return this.myRepository.findAndCount({
      where: { organizationId: orgId },
      take: opts?.limit ?? 20,
      skip: opts?.offset ?? 0,
      order: { createdAt: 'DESC' },
    });
  }

  async create(data: CreateDto) {
    const entity = this.myRepository.create(data);
    return this.myRepository.save(entity);
  }

  async update(id: string, data: UpdateDto) {
    const result = await this.myRepository.update(id, data);
    if (result.affected === 0) throw new NotFoundException('Not found.');
  }

  async remove(id: string) {
    const result = await this.myRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('Not found.');
  }
}
```

## Controller Pattern

```typescript
@Controller('resources')
export class ResourceController {
  constructor(private readonly service: ResourceService) {}

  @ZodResponse({ type: ResourcesResponse })
  @Roles('owner', 'admin')
  @Get()
  async findAll(@RequestUser() user: AuthUser, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    const [items, total] = await this.service.list(user.organizationId, {
      limit: limit ? parseInt(limit, 10) : 20,
      offset: offset ? parseInt(offset, 10) : 0,
    });
    return apiPaginatedResponse(items, Number(total));
  }

  @ZodResponse({ type: CreatedResponse })
  @Post()
  async create(@RequestUser() user: AuthUser, @Body() body: CreateRequest) {
    const created = await this.service.create({ ...body, organizationId: user.organizationId });
    return apiCreatedResponse(created.id);
  }
}
```

## DTO Pattern

```typescript
import { createZodDto } from 'nestjs-zod';
import { createEntitySchema, entityResponseSchema, entitiesResponseSchema } from '@template/shared';

export class CreateEntityRequest extends createZodDto(createEntitySchema) {}
export class EntityResponse extends createZodDto(entityResponseSchema) {}
export class EntitiesResponse extends createZodDto(entitiesResponseSchema) {}
```

## Shared Zod Schema Pattern

```typescript
import { z } from 'zod';
import { nonemptystring } from '../nonemptystring';
import { timestamp } from '../timestamp';
import { buildOkResponse } from '../ApiOkResponse';
import { buildPaginatedResponse } from '../ApiPaginatedResponse';

export const entityModelSchema = z.strictObject({
  id: z.string(),
  name: z.string(),
  createdAt: timestamp,
  updatedAt: timestamp,
});

export const createEntitySchema = z.strictObject({ name: nonemptystring });
export const updateEntitySchema = z.strictObject({ name: nonemptystring.optional() });
export const entityResponseSchema = buildOkResponse(entityModelSchema);
export const entitiesResponseSchema = buildPaginatedResponse(entityModelSchema);
```

## Enum Pattern

```typescript
import { Enum, isEnumType } from '../utils/enumType';

export const Status = ['active', 'inactive'] as const;
export type Status = Enum<typeof Status>;
export const isStatus = isEnumType(Status);
```

## Frontend Query Hook Pattern

```typescript
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@src/lib/queries/defaultQueryFn';
import type { ApiPaginatedResponse } from '@template/shared';

export const useResources = (opts?: { limit?: number; offset?: number }) =>
  useQuery({
    queryKey: ['resources', String(opts?.offset ?? 0)],
    queryFn: async () => {
      const res = await apiClient.get<ApiPaginatedResponse<Resource>>(`/resources?limit=${opts?.limit ?? 20}&offset=${opts?.offset ?? 0}`);
      return res.data;
    },
  });
```

## Frontend Mutation Hook Pattern

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@src/lib/queries/defaultQueryFn';

export const useCreateResource = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Input) => { const res = await apiClient.post('/resources', data); return res.data; },
    onSuccess: () => { toast.success('Created.'); qc.invalidateQueries({ queryKey: ['resources'] }); },
    onError: () => toast.error('Failed.'),
  });
};
```
