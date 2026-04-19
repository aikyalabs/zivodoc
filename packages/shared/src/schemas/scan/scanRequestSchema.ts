import { z } from 'zod';

import { ScanMode } from '../../enums/ScanMode';
import { nonemptystring } from '../nonemptystring';

export const triggerScanSchema = z.strictObject({
  mode: z.enum(ScanMode).optional(),
  branch: nonemptystring.optional(),
});
