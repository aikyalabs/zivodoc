import { z } from 'zod';

import { timestamp } from '../timestamp';

export const organizationModelSchema = z.strictObject({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  createdAt: timestamp,
  updatedAt: timestamp,
});
