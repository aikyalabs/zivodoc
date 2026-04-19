import { z } from 'zod';

import { FindingStatus } from '../../enums/FindingStatus';

export const updateFindingSchema = z.strictObject({
  status: z.enum(FindingStatus),
});
