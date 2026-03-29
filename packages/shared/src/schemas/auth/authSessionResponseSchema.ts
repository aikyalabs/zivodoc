import { z } from 'zod';

import { buildOkResponse } from '../ApiOkResponse';

export const authSessionResponseSchema = buildOkResponse(z.strictObject({ token: z.string() }));
