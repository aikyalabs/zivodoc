import { createZodDto } from 'nestjs-zod';

import {
  createUserSchema,
  updateUserSchema,
  userResponseSchema,
  usersResponseSchema,
} from '@zivodoc/shared';

export class CreateUserRequest extends createZodDto(createUserSchema) {}
export class UpdateUserRequest extends createZodDto(updateUserSchema) {}
export class UserResponse extends createZodDto(userResponseSchema) {}
export class UsersResponse extends createZodDto(usersResponseSchema) {}
