import { z } from 'zod';

import { buildOkResponse } from '../ApiOkResponse';

export const otpSendSchema = z.strictObject({
  email: z.string().email(),
});

export const otpVerifySchema = z.strictObject({
  email: z.string().email(),
  code: z.string().length(6),
});

export const otpSendResponseSchema = buildOkResponse(
  z.strictObject({
    sent: z.boolean(),
  }),
);
