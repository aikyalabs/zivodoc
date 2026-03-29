import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { RoleEntity } from '@db/entities';
import { RoleRepository } from '@db/repositories';
import { Caller, isAdmin } from '@src/auth/request-user.decorator';

@Injectable()
export class RolesService {
  constructor(private readonly roleRepository: RoleRepository) {}

  public async create(
    data: {
      name: string;
      description?: string | null;
      permissions: Array<{ resource: string; actions: string[] }>;
      organizationId?: string | null;
    },
    caller: Caller,
  ) {
    const organizationId = isAdmin(caller) ? (data.organizationId ?? null) : caller.organizationId;

    if (!organizationId) {
      throw new BadRequestException('Organization is required for role creation.');
    }

    const role = this.roleRepository.create({
      ...data,
      organizationId,
    });
    return this.roleRepository.save(role);
  }

  public async findById(id: string, caller: Caller) {
    const role = await this.roleRepository.findOne({ where: { id } });
    if (!role) throw new NotFoundException('Role not found.');
    if (!isAdmin(caller) && role.organizationId !== caller.organizationId) {
      throw new ForbiddenException('Access denied to this role.');
    }
    return role;
  }

  public async list(
    caller: Caller,
    options?: { limit?: number; offset?: number },
  ): Promise<[RoleEntity[], number]> {
    if (!isAdmin(caller) && !caller.organizationId) {
      throw new ForbiddenException('No organization context.');
    }
    const where = isAdmin(caller) ? {} : { organizationId: caller.organizationId! };
    const [items, total] = await this.roleRepository.findAndCount({
      where,
      take: options?.limit ?? 20,
      skip: options?.offset ?? 0,
      order: { createdAt: 'ASC' },
    });

    return [items, total];
  }

  public async update(
    id: string,
    data: {
      name?: string;
      description?: string | null;
      permissions?: Array<{ resource: string; actions: string[] }>;
    },
    caller: Caller,
  ) {
    const role = await this.roleRepository.findOne({ where: { id } });
    if (!role) throw new NotFoundException('Role not found.');
    if (!isAdmin(caller) && role.organizationId !== caller.organizationId) {
      throw new ForbiddenException('Access denied to this role.');
    }

    await this.roleRepository.update(id, data);
  }

  public async remove(id: string, caller: Caller) {
    const role = await this.roleRepository.findOne({ where: { id } });
    if (!role) throw new NotFoundException('Role not found.');
    if (!isAdmin(caller) && role.organizationId !== caller.organizationId) {
      throw new ForbiddenException('Access denied to this role.');
    }

    await this.roleRepository.delete(id);
  }
}
