import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { hash, compare } from 'bcrypt';

import { UserRole } from '@zivodoc/shared';

import { UserEntity } from '@db/entities';
import { UserRepository } from '@db/repositories';
import { RoleRepository } from '@db/repositories';
import { Caller, isAdmin } from '@src/auth/request-user.decorator';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class UsersService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly roleRepository: RoleRepository,
  ) {}

  public async findByEmail(email: string) {
    return this.userRepository.findByEmailPublic(email);
  }

  public async checkPassword(email: string, password: string): Promise<UserEntity | null> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) return null;
    const valid = await compare(password, user.password);
    return valid ? user : null;
  }

  public async create(
    data: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
      role: UserRole;
      organizationId?: string | null;
      roleId?: string | null;
    },
    caller?: Caller,
  ) {
    const existing = await this.userRepository.findByEmailPublic(data.email);
    if (existing) {
      throw new BadRequestException('Email already in use.');
    }

    // Only platform admins can assign the admin role
    if (data.role === 'admin' && caller && !isAdmin(caller)) {
      throw new ForbiddenException('Only platform admins can assign the admin role.');
    }

    const organizationId =
      !caller || isAdmin(caller) ? (data.organizationId ?? null) : caller.organizationId;

    // Validate roleId belongs to the target organization
    const roleId = data.roleId ?? null;
    if (roleId && organizationId) {
      const role = await this.roleRepository.findOne({ where: { id: roleId } });
      if (!role || role.organizationId !== organizationId) {
        throw new BadRequestException('Role does not belong to the target organization.');
      }
    }

    const hashedPassword = await hash(data.password, BCRYPT_ROUNDS);
    const user = this.userRepository.create({
      ...data,
      organizationId,
      roleId,
      password: hashedPassword,
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
      currentPassword?: string;
      newPassword?: string;
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

    // Non-admin callers can only update users in their own org
    if (!isAdmin(caller) && !isSelf && user.organizationId !== caller.organizationId) {
      throw new NotFoundException('User not found.');
    }

    // Only platform admins can assign the admin role
    if (data.role === 'admin' && !isAdmin(caller)) {
      throw new ForbiddenException('Only platform admins can assign the admin role.');
    }

    const updateData: Record<string, unknown> = {};
    if (data.firstName) updateData.firstName = data.firstName;
    if (data.lastName) updateData.lastName = data.lastName;
    if (data.email) updateData.email = data.email;

    // Only privileged callers can change role, isDisabled, organizationId, roleId
    if (isPrivileged) {
      if (data.role) updateData.role = data.role;
      if (data.isDisabled !== undefined) updateData.isDisabled = data.isDisabled;
      if (data.organizationId !== undefined) updateData.organizationId = data.organizationId;
      if (data.roleId !== undefined) {
        // Validate roleId belongs to the user's organization
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

    if (data.newPassword) {
      if (!data.currentPassword) {
        throw new BadRequestException('Current password is required to change password.');
      }
      const userWithPassword = await this.userRepository.findByEmail(user.email);
      if (!userWithPassword) throw new NotFoundException('User not found.');

      const valid = await compare(data.currentPassword, userWithPassword.password);
      if (!valid) {
        throw new BadRequestException('Current password is incorrect.');
      }
      updateData.password = await hash(data.newPassword, BCRYPT_ROUNDS);
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
