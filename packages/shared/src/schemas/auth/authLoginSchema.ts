import { z } from 'zod';

export const authLoginSchema = z.strictObject({
  email: z.string().email(),
  password: z.string().min(1),
});
