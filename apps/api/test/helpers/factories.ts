import { BaseEntity } from '@db/entities';

let counter = 0;

const nextId = () => ++counter;

export const createTestOrganization = (overrides?: Partial<{ name: string; slug: string }>) => ({
  id: BaseEntity.generateId('org'),
  name: overrides?.name ?? `Test Org ${nextId()}`,
  slug: overrides?.slug ?? `test-org-${nextId()}`,
  createdAt: new Date(),
  updatedAt: new Date(),
});

export const createTestUser = (
  organizationId: string,
  overrides?: Partial<{
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: string;
  }>,
) => ({
  id: BaseEntity.generateId('user'),
  firstName: overrides?.firstName ?? `Test`,
  lastName: overrides?.lastName ?? `User ${nextId()}`,
  email: overrides?.email ?? `test-${nextId()}@example.com`,
  password: overrides?.password ?? '$2b$12$LJ3TqyDQ6W4O0VQPZlIbLOKcQmR2h7.cPJp/L7l6Gdb5LQJ5Yp7q2', // "Password123!"
  role: overrides?.role ?? 'member',
  organizationId,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
});

export const resetFactoryCounter = () => {
  counter = 0;
};
