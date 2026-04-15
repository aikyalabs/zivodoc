import { createZodDto } from 'nestjs-zod';

import {
  ApiErrorResponse,
  ApiOkResponse,
  ApiPaginatedResponse,
  createdResponseSchema,
} from '@zivodoc/shared';

export const apiErrorResponse = (status: number, message: string): ApiErrorResponse => ({
  statusCode: status,
  message,
});

export const apiOkResponse = <Body>(payload: Body, message?: string): ApiOkResponse<Body> => ({
  payload,
  meta: message ? { message } : undefined,
});

export const apiPaginatedResponse = <Body>(
  payload: Body[],
  total: number,
  message?: string,
): ApiPaginatedResponse<Body> => ({
  payload,
  meta: { total, message },
});

export class CreatedResponse extends createZodDto(createdResponseSchema) {}

export const apiCreatedResponse = (id: string, message?: string): CreatedResponse => ({
  payload: { id },
  meta: message ? { message } : undefined,
});
