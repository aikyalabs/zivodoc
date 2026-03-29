import { z } from 'zod';

export interface ApiErrorResponse {
  statusCode: number;
  message: string;
}

export interface ApiValidationErrorResponse extends ApiErrorResponse {
  errors: z.ZodIssue[];
}

export const isApiErrorResponse = (response: object): response is ApiErrorResponse =>
  'statusCode' in response && 'message' in response;
