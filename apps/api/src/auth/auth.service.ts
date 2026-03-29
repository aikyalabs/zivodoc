import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { addMinutes, addSeconds } from 'date-fns';

import { AppConfig } from '@src/config.module';
import { UsersService } from '@src/users/users.service';
import { SessionRepository } from '@db/repositories';
import { SessionEntity } from '@db/entities';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly sessionRepository: SessionRepository,
    private readonly configService: ConfigService<AppConfig, true>,
    private readonly dataSource: DataSource,
  ) {}

  public extractTokenFromHeader(authorization?: string): string | undefined {
    const [type, token] = authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  public async getSessionWithUser(token: string) {
    return this.sessionRepository.findValidSession(token);
  }

  public async login(email: string, password: string): Promise<SessionEntity> {
    const user = await this.usersService.checkPassword(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (user.isDisabled) {
      throw new UnauthorizedException(
        'Your account has been disabled. Contact your administrator.',
      );
    }

    return this.createSession(user.id);
  }

  public async signup(
    data: { firstName: string; lastName: string; email: string; password: string },
    organizationId: string,
  ): Promise<SessionEntity> {
    return this.dataSource.transaction(async (manager) => {
      const user = await this.usersService.create({
        ...data,
        role: 'owner',
        organizationId,
      });

      const expirationMinutes = this.configService.get('SESSION_EXPIRATION_MINUTES');
      const session = manager.create(SessionEntity, {
        userId: user.id,
        expiresAt: addMinutes(new Date(), expirationMinutes),
      });

      return manager.save(session);
    });
  }

  public async logout(token: string): Promise<void> {
    await this.invalidateSession(token);
  }

  public async refresh(currentToken: string): Promise<SessionEntity> {
    const session = await this.sessionRepository.findValidSession(currentToken);
    if (!session) {
      throw new UnauthorizedException();
    }

    return this.dataSource.transaction(async (manager) => {
      const invalidationSeconds = this.configService.get('SESSION_INVALIDATION_SECONDS');
      await manager.update(
        SessionEntity,
        { token: currentToken },
        { expiresAt: addSeconds(new Date(), invalidationSeconds) },
      );

      const expirationMinutes = this.configService.get('SESSION_EXPIRATION_MINUTES');
      const newSession = manager.create(SessionEntity, {
        userId: session.userId,
        expiresAt: addMinutes(new Date(), expirationMinutes),
      });

      return manager.save(newSession);
    });
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
