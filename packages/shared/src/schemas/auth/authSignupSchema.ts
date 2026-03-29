import { z } from 'zod';

import { nonemptystring } from '../nonemptystring';

export const passwordSchema = z
  .string()
  .min(12)
  .refine(
    (password) => {
      let hasLetter = false;
      let hasNumber = false;
      for (const char of password) {
        if (/[a-zA-Z]/.test(char)) hasLetter = true;
        if (/[0-9]/.test(char)) hasNumber = true;
        if (hasLetter && hasNumber) return true;
      }
      return false;
    },
    { message: 'Password must contain at least 1 letter and 1 number' },
  );

export const authSignupSchema = z.strictObject({
  firstName: nonemptystring,
  lastName: nonemptystring,
  email: z.string().trim().min(1).email(),
  password: passwordSchema,
});
