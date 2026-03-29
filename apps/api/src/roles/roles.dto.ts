import { createZodDto } from 'nestjs-zod';

import {
  createRoleSchema,
  updateRoleSchema,
  roleResponseSchema,
  rolesResponseSchema,
} from '@template/shared';

export class CreateRoleRequest extends createZodDto(createRoleSchema) {}
export class UpdateRoleRequest extends createZodDto(updateRoleSchema) {}
export class RoleResponse extends createZodDto(roleResponseSchema) {}
export class RolesResponse extends createZodDto(rolesResponseSchema) {}
