import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';

import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';

import { AppConfigModule } from '@src/config.module';
import { HttpExceptionFilter } from '@src/http-exception.filter';
import { AuditInterceptor } from '@src/audit.interceptor';
import { DatabaseModule } from '@db/db.module';
import { AuthModule } from '@src/auth/auth.module';
import { UsersModule } from '@src/users/users.module';
import { OrganizationsModule } from '@src/organizations/organizations.module';
import { RolesModule } from '@src/roles/roles.module';
import { ProjectsModule } from '@src/projects/projects.module';
import { ScansModule } from '@src/scans/scans.module';
import { QueueModule } from '@src/queue/queue.module';
import { ApiKeysModule } from '@src/api-keys/api-keys.module';
import { HealthModule } from '@src/health/health.module';
import { GitHubModule } from '@src/github/github.module';
import { AiKeysModule } from '@src/ai-keys/ai-keys.module';
import { ChatModule } from '@src/chat/chat.module';
import { AdminModule } from '@src/admin/admin.module';

@Module({
  imports: [
    AppConfigModule,
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'medium', ttl: 10000, limit: 50 },
      { name: 'long', ttl: 60000, limit: 200 },
    ]),
    ScheduleModule.forRoot(),
    DatabaseModule,
    AuthModule,
    UsersModule,
    OrganizationsModule,
    RolesModule,
    ProjectsModule,
    ScansModule,
    QueueModule,
    ApiKeysModule,
    HealthModule,
    GitHubModule,
    AiKeysModule,
    ChatModule,
    AdminModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ZodSerializerInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
