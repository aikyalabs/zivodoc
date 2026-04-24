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
  scanSchedule: z.enum(['manual', 'daily', 'weekly']),
  organizationId: z.string(),
  createdAt: timestamp,
  updatedAt: timestamp,
  // Stats from latest scan (populated by list query)
  lastScanStatus: z.string().nullable().optional(),
  lastScanDate: timestamp.nullable().optional(),
  totalScans: z.number().optional(),
  totalFindings: z.number().optional(),
});
