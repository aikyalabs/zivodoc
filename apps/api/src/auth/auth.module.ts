import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';

import { AuthController } from '@src/auth/auth.controller';
import { AuthGuard } from '@src/auth/auth.guard';
import { AuthService } from '@src/auth/auth.service';
import { OtpService } from '@src/auth/otp.service';
import { GoogleStrategy } from '@src/auth/google.strategy';
import { ApiKeysModule } from '@src/api-keys/api-keys.module';
import { OrganizationsModule } from '@src/organizations/organizations.module';
import { UsersModule } from '@src/users/users.module';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    OtpService,
    GoogleStrategy,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
  imports: [PassportModule, ApiKeysModule, OrganizationsModule, UsersModule],
  exports: [AuthService],
})
export class AuthModule {}
