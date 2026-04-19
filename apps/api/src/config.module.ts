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
  REDIS_URL: z.coerce.string().default('redis://localhost:6379'),

  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().default(''),
  GOOGLE_CLIENT_SECRET: z.string().default(''),
  GOOGLE_CALLBACK_URL: z.string().default('http://localhost:3000/auth/google/callback'),

  // AWS SES (for OTP emails)
  AWS_REGION: z.string().default('us-east-1'),
  AWS_ACCESS_KEY_ID: z.string().default(''),
  AWS_SECRET_ACCESS_KEY: z.string().default(''),
  OTP_FROM_EMAIL: z.string().default('noreply@zivodoc.com'),

  // Frontend
  FRONTEND_URL: z.string().default('http://localhost:5173'),

  // MinIO
  MINIO_ENDPOINT: z.coerce.string().default('http://localhost:9000'),
  MINIO_ACCESS_KEY: z.coerce.string().default('minioadmin'),
  MINIO_SECRET_KEY: z.coerce.string().default('minioadmin'),
  MINIO_BUCKET: z.coerce.string().default('uploads'),

  // Scanning
  SCAN_MAX_PAGES: z.coerce.number().default(500),
  SCAN_CONCURRENCY: z.coerce.number().default(2),
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
