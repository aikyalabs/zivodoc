import { z } from 'zod';

import { ScanMode } from '../../enums/ScanMode';
import { ScanStatus } from '../../enums/ScanStatus';
import { timestamp } from '../timestamp';

export const scanStepSchema = z.object({
  name: z.string(),
  label: z.string(),
  status: z.enum(['pending', 'running', 'completed', 'skipped']),
  startedAt: z.number().optional(),
  completedAt: z.number().optional(),
  durationMs: z.number().optional(),
  itemsProcessed: z.number().optional(),
  findingsCount: z.number().optional(),
});

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
  errorCount: z.number(),
  warningCount: z.number(),
  infoCount: z.number(),
  shareToken: z.string().nullable(),
  duration: z.number().nullable(),
  triggerSource: z.string(),
  errorMessage: z.string().nullable(),
  steps: z.array(scanStepSchema).nullable(),
  startedAt: timestamp.nullable(),
  completedAt: timestamp.nullable(),
  createdAt: timestamp,
  updatedAt: timestamp,
});
