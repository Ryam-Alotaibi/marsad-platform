import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly auditLog: AuditLogService,
  ) {}

  private async loadUserWithContext(userId: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { role: true, tenant: true },
    });
  }

  private toResponse(
    user: Awaited<ReturnType<typeof this.loadUserWithContext>>,
  ) {
    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        roleKey: user.role.key,
        roleName: user.role.name,
      },
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        nameAr: user.tenant.nameAr,
        type: user.tenant.type,
        logoUrl: user.tenant.logoUrl,
        primaryColor: user.tenant.primaryColor,
        secondaryColor: user.tenant.secondaryColor,
      },
    };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: { email },
      include: { role: true, tenant: true },
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('بيانات الدخول غير صحيحة');
    }

    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      tenantId: user.tenantId,
      roleKey: user.role.key,
    });

    await this.auditLog.record({
      tenantId: user.tenantId,
      actorUserId: user.id,
      action: 'LOGIN',
      entityType: 'User',
      entityId: user.id,
    });

    return { accessToken, session: this.toResponse(user) };
  }

  async me(userId: string) {
    const user = await this.loadUserWithContext(userId);
    return this.toResponse(user);
  }
}
