import { z } from 'zod';

export const buildOkResponse = <T extends z.ZodType>(payloadSchema: T) =>
  z.strictObject({
    payload: payloadSchema,
    meta: z
      .strictObject({
        message: z.string().optional(),
      })
      .optional(),
  });

export interface ApiOkResponse<Body> {
  payload: Body;
  meta?: {
    message?: string;
  };
}

export const isApiOkResponse = <Body>(response: object): response is ApiOkResponse<Body> =>
  'payload' in response;
