import { createZodDto } from 'nestjs-zod';

import {
  triggerScanSchema,
  scanResponseSchema,
  scansResponseSchema,
  findingsResponseSchema,
  updateFindingSchema,
  scanShareTokenResponseSchema,
  sharedScanResponseSchema,
} from '@zivodoc/shared';

export class TriggerScanRequest extends createZodDto(triggerScanSchema) {}
export class ScanResponse extends createZodDto(scanResponseSchema) {}
export class ScansResponse extends createZodDto(scansResponseSchema) {}
export class FindingsResponse extends createZodDto(findingsResponseSchema) {}
export class UpdateFindingRequest extends createZodDto(updateFindingSchema) {}
export class ScanShareTokenResponse extends createZodDto(scanShareTokenResponseSchema) {}
export class SharedScanResponse extends createZodDto(sharedScanResponseSchema) {}
