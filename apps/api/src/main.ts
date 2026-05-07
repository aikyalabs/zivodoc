import 'reflect-metadata';

import cookieParser from 'cookie-parser';
import type { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { DataSource } from 'typeorm';

import { AppModule } from '@src/app.module';
import { AppConfig } from '@src/config.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true });
  const logger = new Logger('Bootstrap');

  const dataSource = app.get(DataSource);
  const pending = await dataSource.showMigrations();
  if (pending) {
    logger.log('Running pending migrations…');
    await dataSource.runMigrations();
    logger.log('Migrations applied.');
  }

  app.use(cookieParser());
  app.enableShutdownHooks();

  app.use('/chat', (req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '86400');
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });

  const configService = app.get<ConfigService<AppConfig, true>>(ConfigService);
  const port = configService.get('PORT');
  const corsHosts = configService.get('CORS_HOSTS');

  app.enableCors({
    credentials: true,
    methods: ['GET', 'HEAD', 'OPTIONS', 'POST', 'PATCH', 'DELETE'],
    origin: corsHosts,
  });

  if (process.env.NODE_ENV !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('SaaS Template API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  await app.listen(isNaN(port) ? 3000 : port);
}

bootstrap().catch(console.error);
