import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { UserRole } from '@zivodoc/shared';

import { UserEntity } from '@db/entities';
import { UserRepository } from '@db/repositories';
import { RoleRepository } from '@db/repositories';
import { Caller, isAdmin } from '@src/auth/request-user.decorator';

@Injectable()
export class UsersService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly roleRepository: RoleRepository,
  ) {}

  public async findByEmail(email: string) {
    return this.userRepository.findOne({ where: { email } });
  }

  public async findByGoogleId(googleId: string) {
    return this.userRepository.findOne({ where: { googleId } });
  }

  public async findOrCreateByEmail(data: {
    email: string;
    firstName: string;
    lastName: string;
    googleId?: string;
    avatar?: string;
    organizationId: string;
  }): Promise<{ user: UserEntity; isNew: boolean }> {
    const existing = await this.userRepository.findOne({ where: { email: data.email } });
    if (existing) {
      if (data.googleId && !existing.googleId) {
        existing.googleId = data.googleId;
        if (data.avatar) existing.avatar = data.avatar;
        await this.userRepository.save(existing);
      }
      return { user: existing, isNew: false };
    }

    const user = this.userRepository.create({
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      googleId: data.googleId ?? null,
      avatar: data.avatar ?? null,
      role: 'owner' as UserRole,
      organizationId: data.organizationId,
      onboardingCompleted: false,
    });

    const saved = await this.userRepository.save(user);
    return { user: saved, isNew: true };
  }

  public async create(
    data: {
      firstName: string;
      lastName: string;
      email: string;
      role: UserRole;
      organizationId?: string | null;
      roleId?: string | null;
    },
    caller?: Caller,
  ) {
    const existing = await this.userRepository.findOne({ where: { email: data.email } });
    if (existing) {
      throw new BadRequestException('Email already in use.');
    }

    if (data.role === 'admin' && caller && !isAdmin(caller)) {
      throw new ForbiddenException('Only platform admins can assign the admin role.');
    }

    const organizationId =
      !caller || isAdmin(caller) ? (data.organizationId ?? null) : caller.organizationId;

    const roleId = data.roleId ?? null;
    if (roleId && organizationId) {
      const role = await this.roleRepository.findOne({ where: { id: roleId } });
      if (!role || role.organizationId !== organizationId) {
        throw new BadRequestException('Role does not belong to the target organization.');
      }
    }

    const user = this.userRepository.create({
      ...data,
      organizationId,
      roleId,
    });

    return this.userRepository.save(user);
  }

  public async findById(id: string, caller: Caller) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found.');
    if (!isAdmin(caller) && user.organizationId !== caller.organizationId) {
      throw new NotFoundException('User not found.');
    }
    return user;
  }

  public async list(
    caller: Caller,
    options?: { limit?: number; offset?: number },
  ): Promise<[UserEntity[], number]> {
    if (!isAdmin(caller) && !caller.organizationId) {
      throw new ForbiddenException('No organization context.');
    }
    const where = isAdmin(caller) ? {} : { organizationId: caller.organizationId! };
    const [items, total] = await this.userRepository.findAndCount({
      where,
      take: options?.limit ?? 20,
      skip: options?.offset ?? 0,
      order: { createdAt: 'DESC' },
    });

    return [items, total];
  }

  public async update(
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      email?: string;
      role?: UserRole;
      isDisabled?: boolean;
      organizationId?: string | null;
      roleId?: string | null;
      onboardingCompleted?: boolean;
    },
    caller: Caller,
  ) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found.');

    const isSelf = id === caller.id;
    const isPrivileged = isAdmin(caller) || caller.role === 'owner';

    if (!isSelf && !isPrivileged) {
      throw new ForbiddenException(
        'You can only update your own profile or must be an owner/admin.',
      );
    }

    if (!isAdmin(caller) && !isSelf && user.organizationId !== caller.organizationId) {
      throw new NotFoundException('User not found.');
    }

    if (data.role === 'admin' && !isAdmin(caller)) {
      throw new ForbiddenException('Only platform admins can assign the admin role.');
    }

    const updateData: Record<string, unknown> = {};
    if (data.firstName) updateData.firstName = data.firstName;
    if (data.lastName) updateData.lastName = data.lastName;
    if (data.email) updateData.email = data.email;
    if (data.onboardingCompleted !== undefined)
      updateData.onboardingCompleted = data.onboardingCompleted;

    if (isPrivileged) {
      if (data.role) updateData.role = data.role;
      if (data.isDisabled !== undefined) updateData.isDisabled = data.isDisabled;
      if (data.organizationId !== undefined) updateData.organizationId = data.organizationId;
      if (data.roleId !== undefined) {
        const targetOrgId =
          data.organizationId !== undefined ? data.organizationId : user.organizationId;
        if (data.roleId && targetOrgId) {
          const role = await this.roleRepository.findOne({ where: { id: data.roleId } });
          if (!role || role.organizationId !== targetOrgId) {
            throw new BadRequestException('Role does not belong to the target organization.');
          }
        }
        updateData.roleId = data.roleId;
      }
    }

    if (Object.keys(updateData).length > 0) {
      await this.userRepository.update(id, updateData);
    }
  }

  public async remove(id: string, caller: Caller) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found.');

    if (!isAdmin(caller) && !caller.organizationId) {
      throw new ForbiddenException('No organization context.');
    }

    if (!isAdmin(caller) && user.organizationId !== caller.organizationId) {
      throw new NotFoundException('User not found.');
    }

    await this.userRepository.softRemove(user);
  }
}
