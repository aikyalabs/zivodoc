import { z } from 'zod';

import { ScanMode } from '../../enums/ScanMode';
import { timestamp } from '../timestamp';

export const projectModelSchema = z.strictObject({
  id: z.string(),
  name: z.string(),
  siteUrl: z.string().nullable(),
  repoUrl: z.string().nullable(),
  defaultBranch: z.string(),
  docPaths: z.array(z.string()),
  scanMode: z.enum(ScanMode),
  maxPages: z.number(),
  organizationId: z.string(),
  createdAt: timestamp,
  updatedAt: timestamp,
});
