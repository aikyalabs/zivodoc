import { Global, Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';

import {
  OrganizationEntity,
  UserEntity,
  SessionEntity,
  RoleEntity,
  AuditLogEntity,
  ProjectEntity,
  ScanEntity,
  FindingEntity,
} from './entities';
import {
  OrganizationRepository,
  UserRepository,
  SessionRepository,
  RoleRepository,
  AuditLogRepository,
  ProjectRepository,
  ScanRepository,
  FindingRepository,
} from './repositories';
import { AppConfig } from '@src/config.module';

const entities = [
  OrganizationEntity,
  UserEntity,
  SessionEntity,
  RoleEntity,
  AuditLogEntity,
  ProjectEntity,
  ScanEntity,
  FindingEntity,
];

const repositories = [
  OrganizationRepository,
  UserRepository,
  SessionRepository,
  RoleRepository,
  AuditLogRepository,
  ProjectRepository,
  ScanRepository,
  FindingRepository,
];

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>): TypeOrmModuleOptions => ({
        type: 'postgres',
        url: config.get('DATABASE_URL'),
        autoLoadEntities: true,
        entities,
        migrations: [join(__dirname, 'migrations/*{.ts,.js}')],
        synchronize: true,
        extra: {
          max: 20,
          min: 5,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 5000,
        },
      }),
    }),
    TypeOrmModule.forFeature(entities),
  ],
  providers: [...repositories],
  exports: [TypeOrmModule, ...repositories],
})
export class DatabaseModule {}
