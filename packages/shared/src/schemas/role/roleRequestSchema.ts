import { z } from 'zod';

import { nonemptystring } from '../nonemptystring';
import { permissionSchema } from './roleSchema';

export const createRoleSchema = z.strictObject({
  name: nonemptystring,
  description: z.string().nullable().optional(),
  permissions: z.array(permissionSchema),
  organizationId: nonemptystring.optional(),
});

export const updateRoleSchema = z.strictObject({
  name: nonemptystring.optional(),
  description: z.string().nullable().optional(),
  permissions: z.array(permissionSchema).optional(),
});
