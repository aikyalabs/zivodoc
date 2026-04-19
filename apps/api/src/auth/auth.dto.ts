import { createZodDto } from 'nestjs-zod';

import {
  otpSendSchema,
  otpVerifySchema,
  otpSendResponseSchema,
  authProfileResponseSchema,
  authSessionResponseSchema,
  authVerifySessionResponseSchema,
} from '@zivodoc/shared';

export class OtpSendRequest extends createZodDto(otpSendSchema) {}
export class OtpVerifyRequest extends createZodDto(otpVerifySchema) {}
export class OtpSendResponse extends createZodDto(otpSendResponseSchema) {}
export class AuthProfileResponse extends createZodDto(authProfileResponseSchema) {}
export class AuthSessionResponse extends createZodDto(authSessionResponseSchema) {}
export class AuthVerifySessionResponse extends createZodDto(authVerifySessionResponseSchema) {}
