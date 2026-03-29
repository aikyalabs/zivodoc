import { z } from 'zod';

import { buildOkResponse } from './ApiOkResponse';

export const createdResponseSchema = buildOkResponse(z.strictObject({ id: z.string() }));
