import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { UserRole } from '@zivodoc/shared';

import { AuthService } from '@src/auth/auth.service';
import { ApiKeysService } from '@src/api-keys/api-keys.service';
import { IS_PUBLIC_KEY } from '@src/auth/public.decorator';
import { PERMISSIONS_KEY, RequiredPermission } from '@src/auth/permissions.decorator';
import { ROLES_KEY } from '@src/auth/roles.decorator';
import { AuthenticatedRequest } from '@src/auth/request-user.decorator';
import { RoleRepository } from '@db/repositories';

const API_KEY_PREFIX = 'zv_';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
    private readonly apiKeysService: ApiKeysService,
    private readonly roleRepository: RoleRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token =
      this.authService.extractTokenFromHeader(request.headers.authorization) ??
      (request.cookies?.session as string | undefined);

    if (!token) {
      if (isPublic) return true;
      throw new UnauthorizedException();
    }

    // API key auth — tokens starting with zv_
    if (token.startsWith(API_KEY_PREFIX)) {
      return this.authenticateWithApiKey(token, request, isPublic, context);
    }

    // Session auth
    return this.authenticateWithSession(token, request, isPublic, context);
  }

  private async authenticateWithApiKey(
    token: string,
    request: AuthenticatedRequest,
    isPublic: boolean,
    context: ExecutionContext,
  ): Promise<boolean> {
    const apiKey = await this.apiKeysService.validateKey(token);
    if (!apiKey) {
      if (isPublic) return true;
      throw new UnauthorizedException('Invalid API key.');
    }

    if (apiKey.user.isDisabled) {
      throw new UnauthorizedException('Account disabled.');
    }

    request.authSession = {
      token,
      userId: apiKey.userId,
      expiresAt: new Date(Date.now() + 3600_000),
      user: {
        id: apiKey.user.id,
        firstName: apiKey.user.firstName,
        lastName: apiKey.user.lastName,
        email: apiKey.user.email,
        role: apiKey.user.role,
        organizationId: apiKey.user.organizationId,
        roleId: apiKey.user.roleId,
        avatar: apiKey.user.avatar,
        onboardingCompleted: apiKey.user.onboardingCompleted,
      },
    };

    return this.checkRolesAndPermissions(apiKey.user.role, apiKey.user.roleId, context);
  }

  private async authenticateWithSession(
    token: string,
    request: AuthenticatedRequest,
    isPublic: boolean,
    context: ExecutionContext,
  ): Promise<boolean> {
    const session = await this.authService.getSessionWithUser(token);
    if (!session) {
      if (isPublic) return true;
      throw new UnauthorizedException();
    }

    if (session.user.isDisabled) {
      throw new UnauthorizedException('Your account has been disabled.');
    }

    request.authSession = {
      token: session.token,
      userId: session.userId,
      expiresAt: session.expiresAt,
      user: {
        id: session.user.id,
        firstName: session.user.firstName,
        lastName: session.user.lastName,
        email: session.user.email,
        role: session.user.role,
        organizationId: session.user.organizationId,
        roleId: session.user.roleId,
        avatar: session.user.avatar,
        onboardingCompleted: session.user.onboardingCompleted,
      },
    };

    return this.checkRolesAndPermissions(session.user.role, session.user.roleId, context);
  }

  private async checkRolesAndPermissions(
    userRole: UserRole,
    roleId: string | null,
    context: ExecutionContext,
  ): Promise<boolean> {
    if (userRole === 'admin') return true;

    const roles = this.reflector.getAllAndOverride<UserRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (roles && roles.length > 0 && !roles.includes(userRole)) {
      throw new ForbiddenException('Insufficient role privileges.');
    }

    const requiredPermissions = this.reflector.getAllAndOverride<RequiredPermission[] | undefined>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (requiredPermissions && requiredPermissions.length > 0) {
      if (!roleId) throw new ForbiddenException('No role assignment.');

      const assignedRole = await this.roleRepository.findOne({ where: { id: roleId } });
      if (!assignedRole) throw new ForbiddenException('Assigned role not found.');

      const userPermissions = assignedRole.permissions ?? [];
      const hasAll = requiredPermissions.every((required) =>
        userPermissions.some(
          (perm) => perm.resource === required.resource && perm.actions.includes(required.action),
        ),
      );

      if (!hasAll) throw new ForbiddenException('Insufficient permissions.');
    }

    return true;
  }
}
