import { z } from 'zod';

import { timestamp } from '../timestamp';

export const permissionSchema = z.strictObject({
  resource: z.string(),
  actions: z.array(z.enum(['create', 'read', 'update', 'delete', 'manage'])),
});

export const roleModelSchema = z.strictObject({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  permissions: z.array(permissionSchema),
  organizationId: z.string(),
  createdAt: timestamp,
  updatedAt: timestamp,
});
