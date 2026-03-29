import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { AuthController } from '@src/auth/auth.controller';
import { AuthGuard } from '@src/auth/auth.guard';
import { AuthService } from '@src/auth/auth.service';
import { OrganizationsModule } from '@src/organizations/organizations.module';
import { UsersModule } from '@src/users/users.module';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
  imports: [OrganizationsModule, UsersModule],
  exports: [AuthService],
})
export class AuthModule {}
