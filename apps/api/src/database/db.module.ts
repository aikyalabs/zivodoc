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
} from './entities';
import {
  OrganizationRepository,
  UserRepository,
  SessionRepository,
  RoleRepository,
  AuditLogRepository,
} from './repositories';
import { AppConfig } from '@src/config.module';

const entities = [OrganizationEntity, UserEntity, SessionEntity, RoleEntity, AuditLogEntity];

const repositories = [
  OrganizationRepository,
  UserRepository,
  SessionRepository,
  RoleRepository,
  AuditLogRepository,
];

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      // NOTE: Entity properties use camelCase which TypeORM maps directly to
      // column names.  Our migrations define columns in snake_case and each
      // entity column that differs uses an explicit `{ name: 'snake_case' }`
      // option.  If you prefer automatic conversion, install
      // `typeorm-naming-strategies` and set `namingStrategy` here.
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
