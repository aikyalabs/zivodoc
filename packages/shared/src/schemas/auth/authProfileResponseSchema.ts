import { z } from 'zod';

import { buildOkResponse } from '../ApiOkResponse';
import { UserRole } from '../../enums/UserRole';
import { timestamp } from '../timestamp';

export const authProfileSchema = z.strictObject({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  role: z.enum(UserRole),
  organizationId: z.string().nullable(),
  roleId: z.string().nullable(),
});

export const authProfileResponseSchema = buildOkResponse(
  z.strictObject({
    expiresAt: timestamp,
    user: authProfileSchema,
  }),
);

export type UserAuthProfile = z.output<typeof authProfileSchema>;
