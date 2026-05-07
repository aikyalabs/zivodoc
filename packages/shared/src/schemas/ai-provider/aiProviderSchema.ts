import { z } from 'zod';

import { nonemptystring } from '../nonemptystring';
import { timestamp } from '../timestamp';

export const aiProvider = z.enum(['anthropic', 'openai']);
export type AiProvider = z.infer<typeof aiProvider>;

export const aiProviderKeyModelSchema = z.strictObject({
  id: z.string(),
  organizationId: z.string(),
  provider: aiProvider,
  model: z.string(),
  keyPreview: z.string(),
  lastUsedAt: timestamp.nullable(),
  lastVerifiedAt: timestamp.nullable(),
  createdAt: timestamp,
  updatedAt: timestamp,
});

export const upsertAiProviderKeySchema = z.strictObject({
  provider: aiProvider,
  apiKey: nonemptystring,
  model: nonemptystring.optional(),
});
