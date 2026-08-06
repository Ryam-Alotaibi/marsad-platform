import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser, type RequestUser } from './current-user.decorator';
import { AUTH_COOKIE_NAME } from './auth.constants';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwt: JwtService,
  ) {}

  @Post('login')
  @Throttle({ default: { ttl: 60_000, limit: 8 } })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, session } = await this.authService.login(
      dto.email,
      dto.password,
    );
    this.setSessionCookie(res, accessToken);
    return session;
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(AUTH_COOKIE_NAME, { path: '/' });
    return { ok: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: RequestUser) {
    return this.authService.me(user.id);
  }

  private setSessionCookie(res: Response, accessToken: string) {
    const decoded = this.jwt.decode(accessToken) as { exp?: number } | null;
    const maxAge = decoded?.exp
      ? Math.max(0, decoded.exp * 1000 - Date.now())
      : 15 * 60 * 1000;

    // Web and API are deployed on different subdomains (separate "sites" per
    // the Public Suffix List, e.g. distinct *.up.railway.app entries), so the
    // cookie must be sameSite: 'none' to survive cross-site fetches — which
    // in turn requires secure: true or browsers drop it outright. Locally
    // both run on http://localhost (same-site), where 'lax' + non-secure is
    // correct instead.
    const crossSite = process.env.NODE_ENV === 'production';

    res.cookie(AUTH_COOKIE_NAME, accessToken, {
      httpOnly: true,
      sameSite: crossSite ? 'none' : 'lax',
      secure: crossSite,
      path: '/',
      maxAge,
    });
  }
}
