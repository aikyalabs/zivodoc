import { z } from 'zod';

export const buildPaginatedResponse = <T extends z.ZodType>(payloadSchema: T) =>
  z.strictObject({
    payload: z.array(payloadSchema),
    meta: z.strictObject({
      total: z.number(),
      message: z.string().optional(),
    }),
  });

export interface ApiPaginatedResponse<Body> {
  payload: Body[];
  meta: {
    total: number;
    message?: string;
  };
}

export const isApiPaginatedResponse = <Body>(
  response: object,
): response is ApiPaginatedResponse<Body> =>
  'payload' in response &&
  Array.isArray((response as ApiPaginatedResponse<Body>).payload) &&
  'meta' in response &&
  typeof (response as ApiPaginatedResponse<Body>).meta?.total === 'number';
