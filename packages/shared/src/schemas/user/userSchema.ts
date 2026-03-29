import { z } from 'zod';

import { UserRole } from '../../enums/UserRole';
import { timestamp } from '../timestamp';

export const userModelSchema = z.strictObject({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  role: z.enum(UserRole),
  isDisabled: z.boolean(),
  organizationId: z.string().nullable(),
  roleId: z.string().nullable(),
  createdAt: timestamp,
  updatedAt: timestamp,
  deletedAt: timestamp.nullable(),
});
