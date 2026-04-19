import { z } from 'zod';

import { UserRole } from '../../enums/UserRole';
import { timestamp } from '../timestamp';

export const userModelSchema = z.strictObject({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  googleId: z.string().nullable(),
  role: z.enum(UserRole),
  isDisabled: z.boolean(),
  organizationId: z.string().nullable(),
  roleId: z.string().nullable(),
  avatar: z.string().nullable(),
  onboardingCompleted: z.boolean(),
  createdAt: timestamp,
  updatedAt: timestamp,
  deletedAt: timestamp.nullable(),
});
