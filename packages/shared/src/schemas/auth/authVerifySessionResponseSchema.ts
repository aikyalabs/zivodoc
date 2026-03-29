import { z } from 'zod';

import { buildOkResponse } from '../ApiOkResponse';

export const authVerifySessionResponseSchema = buildOkResponse(
  z.strictObject({
    expiresAt: z.coerce.date().nullable(),
  }),
);
