import { z } from 'zod';

import { PlanType } from '../../enums/PlanType';
import { timestamp } from '../timestamp';

export const organizationModelSchema = z.strictObject({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  plan: z.enum(PlanType),
  scanQuota: z.number(),
  scansUsedThisMonth: z.number(),
  maxPages: z.number(),
  maxProjects: z.number(),
  createdAt: timestamp,
  updatedAt: timestamp,
});
