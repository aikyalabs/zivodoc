import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

import { UserRole } from '@zivodoc/shared';

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  organizationId: string | null;
  roleId: string | null;
  avatar: string | null;
  onboardingCompleted: boolean;
}

export interface SessionUser {
  token: string;
  userId: string;
  expiresAt: Date;
  user: AuthUser;
}

export interface AuthenticatedRequest extends Request {
  authSession?: SessionUser;
}

export interface Caller {
  id: string;
  role: UserRole;
  organizationId: string | null;
}

export function isAdmin(caller: Caller): boolean {
  return caller.role === 'admin';
}

export const RequestUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser | undefined => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!request.authSession?.user) {
      return undefined;
    }

    return {
      id: request.authSession.user.id,
      firstName: request.authSession.user.firstName,
      lastName: request.authSession.user.lastName,
      email: request.authSession.user.email,
      role: request.authSession.user.role,
      organizationId: request.authSession.user.organizationId,
      roleId: request.authSession.user.roleId,
      avatar: request.authSession.user.avatar,
      onboardingCompleted: request.authSession.user.onboardingCompleted,
    };
  },
);
