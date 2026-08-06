import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { AUTH_COOKIE_NAME } from '../auth.constants';

export interface JwtPayload {
  sub: string;
  tenantId: string;
  roleKey: string;
}

function fromCookie(req: Request): string | null {
  const cookies = req.cookies as Record<string, string> | undefined;
  return cookies?.[AUTH_COOKIE_NAME] ?? null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    /* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access -- passport-jwt's CJS typings don't resolve cleanly under this project's module settings */
    super({
      // خُزِّن سابقًا كـ Bearer token بـ localStorage (عرضة لسرقة عبر XSS). الآن
      // يُقرأ حصرًا من كوكي httpOnly لا تستطيع أي سكربت بالمتصفح قراءته — راجع
      // ARCHITECTURE.md لتفاصيل الانتقال.
      jwtFromRequest: ExtractJwt.fromExtractors([fromCookie]),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
    /* eslint-enable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
  }

  validate(payload: JwtPayload) {
    return {
      id: payload.sub,
      tenantId: payload.tenantId,
      roleKey: payload.roleKey,
    };
  }
}
