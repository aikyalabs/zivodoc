import { z } from 'zod';

export const optionalstring = z
  .string()
  .trim()
  .transform((value) => (value === '' ? undefined : value))
  .optional();
