import 'reflect-metadata';

import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from '@src/app.module';
import { AppConfig } from '@src/config.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableShutdownHooks();

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
