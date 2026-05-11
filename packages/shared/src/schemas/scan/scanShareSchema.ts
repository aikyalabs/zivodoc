import { z } from 'zod';

import { buildOkResponse } from '../ApiOkResponse';
import { scanModelSchema } from './scanSchema';

export const scanShareTokenResponseSchema = buildOkResponse(z.strictObject({ token: z.string() }));

export const sharedScanFindingSchema = z.strictObject({
  id: z.string(),
  category: z.string(),
  severity: z.string(),
  source: z.string(),
  line: z.number(),
  title: z.string(),
  description: z.string(),
  status: z.string(),
});

export const sharedScanResponseSchema = buildOkResponse(
  z.strictObject({
    scan: scanModelSchema,
    projectName: z.string(),
    findings: z.array(sharedScanFindingSchema),
  }),
);
