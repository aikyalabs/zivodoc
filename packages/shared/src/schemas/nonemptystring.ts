import { z } from 'zod';

export const nonemptystring = z.string().trim().min(1);
