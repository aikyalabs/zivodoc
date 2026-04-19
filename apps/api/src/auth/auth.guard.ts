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
import { IS_PUBLIC_KEY } from '@src/auth/public.decorator';
import { PERMISSIONS_KEY, RequiredPermission } from '@src/auth/permissions.decorator';
import { ROLES_KEY } from '@src/auth/roles.decorator';
import { AuthenticatedRequest } from '@src/auth/request-user.decorator';
import { RoleRepository } from '@db/repositories';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
    private readonly roleRepository: RoleRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.authService.extractTokenFromHeader(request.headers.authorization);

    if (!token) {
      if (isPublic) return true;
      throw new UnauthorizedException();
    }

    const session = await this.authService.getSessionWithUser(token);
    if (!session) {
      if (isPublic) return true;
      throw new UnauthorizedException();
    }

    if (session.user.isDisabled) {
      throw new UnauthorizedException(
        'Your account has been disabled. Contact your administrator.',
      );
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

    // Platform admins bypass all role and permission checks
    if (session.user.role === 'admin') {
      return true;
    }

    const roles = this.reflector.getAllAndOverride<UserRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (roles && roles.length > 0) {
      if (!roles.includes(session.user.role)) {
        throw new ForbiddenException('Insufficient role privileges.');
      }
    }

    const requiredPermissions = this.reflector.getAllAndOverride<RequiredPermission[] | undefined>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (requiredPermissions && requiredPermissions.length > 0) {
      if (!session.user.roleId) {
        throw new ForbiddenException('No role assignment for permission check.');
      }

      const assignedRole = await this.roleRepository.findOne({
        where: { id: session.user.roleId },
      });

      if (!assignedRole) {
        throw new ForbiddenException('Assigned role not found.');
      }

      const userPermissions = assignedRole.permissions ?? [];

      const hasAllPermissions = requiredPermissions.every((required) =>
        userPermissions.some(
          (perm) => perm.resource === required.resource && perm.actions.includes(required.action),
        ),
      );

      if (!hasAllPermissions) {
        throw new ForbiddenException('Insufficient permissions.');
      }
    }

    return true;
  }
}
