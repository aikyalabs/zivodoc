import { createZodDto } from 'nestjs-zod';

import {
  triggerScanSchema,
  scanResponseSchema,
  scansResponseSchema,
  findingResponseSchema,
  findingsResponseSchema,
  updateFindingSchema,
} from '@zivodoc/shared';

export class TriggerScanRequest extends createZodDto(triggerScanSchema) {}
export class ScanResponse extends createZodDto(scanResponseSchema) {}
export class ScansResponse extends createZodDto(scansResponseSchema) {}
export class FindingResponse extends createZodDto(findingResponseSchema) {}
export class FindingsResponse extends createZodDto(findingsResponseSchema) {}
export class UpdateFindingRequest extends createZodDto(updateFindingSchema) {}
