import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { AppModule } from '@src/app.module';
import { TestingConfigModule } from '@test/helpers/test-config.module';
import { AppConfigModule } from '@src/config.module';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideModule(AppConfigModule)
      .useModule(TestingConfigModule)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  describe('GET /auth', () => {
    it('should return null expiresAt when not authenticated', async () => {
      const response = await request(app.getHttpServer()).get('/auth').expect(200);

      expect(response.body.payload.expiresAt).toBeNull();
    });
  });

  describe('GET /health', () => {
    it('should return ok status', async () => {
      const response = await request(app.getHttpServer()).get('/health').expect(200);

      expect(response.body.status).toBe('ok');
      expect(response.body.timestamp).toBeDefined();
    });
  });
});
