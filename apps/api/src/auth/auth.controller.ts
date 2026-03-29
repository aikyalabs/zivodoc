import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { ZodResponse } from 'nestjs-zod';
import { Request } from 'express';

import { apiOkResponse } from '@src/api-response.helper';
import {
  AuthLoginRequest,
  AuthSignupRequest,
  AuthProfileResponse,
  AuthSessionResponse,
  AuthVerifySessionResponse,
} from '@src/auth/auth.dto';
import { AuthService } from '@src/auth/auth.service';
import { Public } from '@src/auth/public.decorator';
import { AuthUser, AuthenticatedRequest, RequestUser } from '@src/auth/request-user.decorator';
import { OrganizationsService } from '@src/organizations/organizations.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly organizationsService: OrganizationsService,
  ) {}

  @ZodResponse({ type: AuthProfileResponse })
  @Get('profile')
  getProfile(@Req() req: AuthenticatedRequest, @RequestUser() user: AuthUser) {
    return apiOkResponse({
      expiresAt: req.authSession?.expiresAt ?? new Date(),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organizationId: user.organizationId,
        roleId: user.roleId,
      },
    });
  }

  @ZodResponse({ type: AuthVerifySessionResponse })
  @Public()
  @Get()
  verifySession(@Req() req: AuthenticatedRequest, @RequestUser() user: AuthUser | undefined) {
    return apiOkResponse({ expiresAt: user ? (req.authSession?.expiresAt ?? null) : null });
  }

  @ZodResponse({ type: AuthSessionResponse })
  @Patch()
  async refreshSession(@Req() req: Request) {
    const token = this.authService.extractTokenFromHeader(req.headers.authorization);
    if (!token) return apiOkResponse({ token: '' });
    const session = await this.authService.refresh(token);
    return apiOkResponse({ token: session.token });
  }

  @ZodResponse({ type: AuthSessionResponse })
  @Public()
  @Post('login')
  async login(@Body() body: AuthLoginRequest) {
    const session = await this.authService.login(body.email, body.password);
    return apiOkResponse({ token: session.token });
  }

  @ZodResponse({ type: AuthSessionResponse })
  @Public()
  @Post('signup')
  async signup(@Body() body: AuthSignupRequest) {
    const randomSuffix = Math.random().toString(36).slice(2, 8);
    const slug = `${body.email.split('@')[0]}-${randomSuffix}`;

    const org = await this.organizationsService.create({
      name: `${body.firstName}'s Organization`,
      slug,
    });

    const session = await this.authService.signup(body, org.id);
    return apiOkResponse({ token: session.token });
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete()
  async logout(@Req() req: Request): Promise<void> {
    const token = this.authService.extractTokenFromHeader(req.headers.authorization);
    if (token) await this.authService.logout(token);
  }
}
