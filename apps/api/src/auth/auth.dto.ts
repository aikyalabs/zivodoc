import { createZodDto } from 'nestjs-zod';

import {
  authLoginSchema,
  authSignupSchema,
  authProfileResponseSchema,
  authSessionResponseSchema,
  authVerifySessionResponseSchema,
} from '@template/shared';

export class AuthLoginRequest extends createZodDto(authLoginSchema) {}
export class AuthSignupRequest extends createZodDto(authSignupSchema) {}
export class AuthProfileResponse extends createZodDto(authProfileResponseSchema) {}
export class AuthSessionResponse extends createZodDto(authSessionResponseSchema) {}
export class AuthVerifySessionResponse extends createZodDto(authVerifySessionResponseSchema) {}
