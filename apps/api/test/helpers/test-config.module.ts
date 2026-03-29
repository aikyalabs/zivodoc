import { ConfigModule } from '@nestjs/config';

export const TestingConfigModule = ConfigModule.forRoot({
  isGlobal: true,
  load: [
    () => ({
      PORT: 3000,
      HOST: '0.0.0.0',
      CORS_HOSTS: ['http://localhost:5173'],
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:15432/saas_template_test',
      SESSION_EXPIRATION_MINUTES: 60,
      SESSION_INVALIDATION_SECONDS: 30,
      MINIO_ENDPOINT: 'http://localhost:9000',
      MINIO_ACCESS_KEY: 'minioadmin',
      MINIO_SECRET_KEY: 'minioadmin',
      MINIO_BUCKET: 'test-uploads',
      REDIS_URL: undefined,
    }),
  ],
});
