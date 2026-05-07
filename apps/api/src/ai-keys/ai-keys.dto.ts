import { createZodDto } from 'nestjs-zod';

import { upsertAiProviderKeySchema } from '@zivodoc/shared';

export class UpsertAiProviderKeyRequest extends createZodDto(upsertAiProviderKeySchema) {}
