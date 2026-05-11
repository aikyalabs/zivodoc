import crypto from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { addMinutes, addSeconds } from 'date-fns';

import { AppConfig } from '@src/config.module';
import { UsersService } from '@src/users/users.service';
import { OrganizationsService } from '@src/organizations/organizations.service';
import { SessionRepository } from '@db/repositories';
import { SessionEntity } from '@db/entities';
import { OtpService } from './otp.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly organizationsService: OrganizationsService,
    private readonly sessionRepository: SessionRepository,
    private readonly configService: ConfigService<AppConfig, true>,
    private readonly otpService: OtpService,
  ) {}

  public extractTokenFromHeader(authorization?: string): string | undefined {
    const [type, token] = authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  public async getSessionWithUser(token: string) {
    return this.sessionRepository.findValidSession(token);
  }

  public async handleGoogleAuth(profile: {
    googleId: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  }): Promise<{ session: SessionEntity; isNew: boolean }> {
    const { user, isNew } = await this.findOrCreateUser({
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      googleId: profile.googleId,
      avatar: profile.avatar,
    });

    if (user.isDisabled) {
      throw new UnauthorizedException('Your account has been disabled.');
    }

    const session = await this.createSession(user.id);
    return { session, isNew };
  }

  public async sendOtp(email: string): Promise<void> {
    await this.otpService.sendOtp(email);
  }

  public async verifyOtp(
    email: string,
    code: string,
  ): Promise<{ session: SessionEntity; isNew: boolean }> {
    await this.otpService.verifyOtp(email, code);

    const { user, isNew } = await this.findOrCreateUser({
      email,
      firstName: email.split('@')[0],
      lastName: '',
    });

    if (user.isDisabled) {
      throw new UnauthorizedException('Your account has been disabled.');
    }

    const session = await this.createSession(user.id);
    return { session, isNew };
  }

  public async completeOnboarding(
    userId: string,
    caller: { id: string; role: string; organizationId: string | null },
  ): Promise<void> {
    await this.usersService.update(
      userId,
      { onboardingCompleted: true },
      caller as import('@src/auth/request-user.decorator').Caller,
    );
  }

  public async logout(token: string): Promise<void> {
    await this.invalidateSession(token);
  }

  public async refresh(currentToken: string): Promise<SessionEntity> {
    const session = await this.sessionRepository.findValidSession(currentToken);
    if (!session) {
      throw new UnauthorizedException();
    }

    const invalidationSeconds = this.configService.get('SESSION_INVALIDATION_SECONDS');
    await this.sessionRepository.update(
      { token: currentToken },
      { expiresAt: addSeconds(new Date(), invalidationSeconds) },
    );

    return this.createSession(session.userId);
  }

  private async findOrCreateUser(data: {
    email: string;
    firstName: string;
    lastName: string;
    googleId?: string;
    avatar?: string;
  }) {
    const existing = await this.usersService.findByEmail(data.email);
    if (existing) {
      if (data.googleId && !existing.googleId) {
        existing.googleId = data.googleId;
        if (data.avatar) existing.avatar = data.avatar;
      }
      return { user: existing, isNew: false };
    }

    const slug = `${data.email.split('@')[0]}-${crypto.randomBytes(4).toString('hex')}`;
    const org = await this.organizationsService.create({
      name: `${data.firstName || data.email.split('@')[0]}'s workspace`,
      slug,
    });

    const { user } = await this.usersService.findOrCreateByEmail({
      ...data,
      organizationId: org.id,
    });

    return { user, isNew: true };
  }

  private async invalidateSession(token: string): Promise<void> {
    const invalidationSeconds = this.configService.get('SESSION_INVALIDATION_SECONDS');
    await this.sessionRepository.update(
      { token },
      { expiresAt: addSeconds(new Date(), invalidationSeconds) },
    );
  }

  private async createSession(userId: string): Promise<SessionEntity> {
    const expirationMinutes = this.configService.get('SESSION_EXPIRATION_MINUTES');
    const session = this.sessionRepository.create({
      userId,
      expiresAt: addMinutes(new Date(), expirationMinutes),
    });
    return this.sessionRepository.save(session);
  }
}
