import { ConfigModule } from '@nestjs/config';
import { z } from 'zod';

const configValidationSchema = z.object({
  PORT: z.coerce.number().default(3000),
  HOST: z.coerce.string().optional(),
  CORS_HOSTS: z.coerce
    .string()
    .default('http://localhost:5173')
    .transform((hosts) => hosts.split(',').map((host) => host.trim())),
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/saas_template'),
  SESSION_EXPIRATION_MINUTES: z.coerce.number().default(60),
  SESSION_INVALIDATION_SECONDS: z.coerce.number().default(30),
  MINIO_ENDPOINT: z.coerce.string().default('http://localhost:9000'),
  MINIO_ACCESS_KEY: z.coerce.string().default('minioadmin'),
  MINIO_SECRET_KEY: z.coerce.string().default('minioadmin'),
  MINIO_BUCKET: z.coerce.string().default('uploads'),
  REDIS_URL: z.coerce.string().optional(),
});

export type AppConfig = z.infer<typeof configValidationSchema>;

export const AppConfigModule = ConfigModule.forRoot({
  cache: true,
  isGlobal: true,
  validate: (config: Record<string, unknown>) => {
    const result = configValidationSchema.safeParse(config);
    if (!result.success) {
      const formatted = result.error.issues
        .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
        .join('\n');
      throw new Error(`Invalid environment variables:\n${formatted}`);
    }
    return result.data;
  },
});
