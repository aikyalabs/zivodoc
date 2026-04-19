import { z } from 'zod';

import { ScanMode } from '../../enums/ScanMode';
import { ScanStatus } from '../../enums/ScanStatus';
import { timestamp } from '../timestamp';

export const scanModelSchema = z.strictObject({
  id: z.string(),
  projectId: z.string(),
  organizationId: z.string(),
  mode: z.enum(ScanMode),
  status: z.enum(ScanStatus),
  branch: z.string().nullable(),
  commitSha: z.string().nullable(),
  pagesScanned: z.number(),
  codeBlocksFound: z.number(),
  linksChecked: z.number(),
  findingsCount: z.number(),
  duration: z.number().nullable(),
  errorMessage: z.string().nullable(),
  startedAt: timestamp.nullable(),
  completedAt: timestamp.nullable(),
  createdAt: timestamp,
  updatedAt: timestamp,
});
