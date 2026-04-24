import { z } from 'zod';

import { FindingCategory } from '../../enums/FindingCategory';
import { FindingSeverity } from '../../enums/FindingSeverity';
import { FindingStatus } from '../../enums/FindingStatus';
import { timestamp } from '../timestamp';

export const findingModelSchema = z.strictObject({
  id: z.string(),
  scanId: z.string(),
  projectId: z.string(),
  organizationId: z.string(),
  category: z.enum(FindingCategory),
  severity: z.enum(FindingSeverity),
  source: z.string(),
  line: z.number(),
  title: z.string(),
  description: z.string(),
  suggestion: z.string().nullable(),
  status: z.enum(FindingStatus),
  rawData: z.record(z.unknown()).nullable(),
  // Tracking fields for cross-scan reconciliation
  fingerprint: z.string(),
  firstSeenScanId: z.string(),
  lastSeenScanId: z.string(),
  seenCount: z.number(),
  createdAt: timestamp,
  updatedAt: timestamp,
});
