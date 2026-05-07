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

  // Scanning
  SCAN_MAX_PAGES: z.coerce.number().default(500),
  SCAN_CONCURRENCY: z.coerce.number().default(2),

  // Encryption — used to encrypt user-provided AI provider keys at rest. 64-char hex (32 bytes).
  ENCRYPTION_KEY: z
    .string()
    .default('0000000000000000000000000000000000000000000000000000000000000000'),

  // Embeddings: 384-dim. Uses org's OpenAI BYOK key if set (text-embedding-3-small with
  // dimensions:384), otherwise runs Xenova/bge-small-en-v1.5 locally via onnxruntime.
  EMBEDDING_DIMENSIONS: z.coerce.number().default(384),
  EMBEDDING_LOCAL_MODEL: z.string().default('Xenova/bge-small-en-v1.5'),
  EMBEDDING_OPENAI_MODEL: z.string().default('text-embedding-3-small'),

  // GitHub App
  GITHUB_APP_ID: z.string().default(''),
  GITHUB_APP_PRIVATE_KEY: z.string().default(''),
  GITHUB_APP_WEBHOOK_SECRET: z.string().default(''),
  GITHUB_APP_CLIENT_ID: z.string().default(''),
  GITHUB_APP_CLIENT_SECRET: z.string().default(''),
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
