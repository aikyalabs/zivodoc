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
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';
import { ZodResponse } from 'nestjs-zod';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';

import { apiOkResponse } from '@src/api-response.helper';
import { AppConfig } from '@src/config.module';
import {
  OtpSendRequest,
  OtpVerifyRequest,
  OtpSendResponse,
  AuthProfileResponse,
  AuthSessionResponse,
  AuthVerifySessionResponse,
} from '@src/auth/auth.dto';
import { AuthService } from '@src/auth/auth.service';
import { Public } from '@src/auth/public.decorator';
import { AuthUser, AuthenticatedRequest, RequestUser } from '@src/auth/request-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService<AppConfig, true>,
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
        avatar: user.avatar,
        onboardingCompleted: user.onboardingCompleted,
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

  @Public()
  @Get('google')
  @UseGuards(PassportAuthGuard('google'))
  googleAuth() {}

  @Public()
  @Get('google/callback')
  @UseGuards(PassportAuthGuard('google'))
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const profile = req.user as {
      googleId: string;
      email: string;
      firstName: string;
      lastName: string;
      avatar?: string;
    };

    const session = await this.authService.handleGoogleAuth(profile);
    this.setSessionCookie(res, session.token);
    const frontendUrl = this.config.get('FRONTEND_URL');
    res.redirect(`${frontendUrl}/auth/callback?token=${session.token}`);
  }

  @ZodResponse({ type: OtpSendResponse })
  @Public()
  @Post('otp/send')
  async sendOtp(@Body() body: OtpSendRequest) {
    await this.authService.sendOtp(body.email);
    return apiOkResponse({ sent: true });
  }

  @ZodResponse({ type: AuthSessionResponse })
  @Public()
  @Post('otp/verify')
  async verifyOtp(@Body() body: OtpVerifyRequest, @Res({ passthrough: true }) res: Response) {
    const session = await this.authService.verifyOtp(body.email, body.code);
    this.setSessionCookie(res, session.token);
    return apiOkResponse({ token: session.token });
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Patch('onboarding')
  async completeOnboarding(@RequestUser() user: AuthUser): Promise<void> {
    await this.authService.completeOnboarding(user.id, user);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete()
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    const token = this.extractToken(req);
    if (token) await this.authService.logout(token);
    res.clearCookie('session', { httpOnly: true, sameSite: 'lax', path: '/' });
  }

  private extractToken(req: Request): string | undefined {
    return (
      this.authService.extractTokenFromHeader(req.headers.authorization) ??
      (req.cookies?.session as string | undefined)
    );
  }

  private setSessionCookie(res: Response, token: string): void {
    res.cookie('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: this.config.get('SESSION_EXPIRATION_MINUTES') * 60 * 1000,
    });
  }
}
