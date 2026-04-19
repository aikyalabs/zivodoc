import { z } from 'zod';

import { UserRole } from '../../enums/UserRole';
import { nonemptystring } from '../nonemptystring';

export const createUserSchema = z.strictObject({
  firstName: nonemptystring,
  lastName: nonemptystring,
  email: z.string().email(),
  role: z.enum(UserRole).default('member'),
  organizationId: nonemptystring.nullable().optional(),
  roleId: nonemptystring.nullable().optional(),
});

export const updateUserSchema = z.strictObject({
  firstName: nonemptystring.optional(),
  lastName: nonemptystring.optional(),
  email: z.string().email().optional(),
  role: z.enum(UserRole).optional(),
  isDisabled: z.boolean().optional(),
  organizationId: nonemptystring.nullable().optional(),
  roleId: nonemptystring.nullable().optional(),
  onboardingCompleted: z.boolean().optional(),
});
