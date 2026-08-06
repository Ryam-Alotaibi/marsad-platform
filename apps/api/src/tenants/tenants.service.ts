import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { DEFAULT_ROLE_KEYS, ROLE_LABELS_AR, type RoleKey } from '@marsad/shared';
import type { SetupTenantDto } from './dto/setup-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        nameAr: true,
        type: true,
        logoUrl: true,
        primaryColor: true,
        secondaryColor: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Real self-service tenant onboarding — replaces the previous
   * seed-script-only path. Creates the tenant, its 7 default roles (same
   * source of truth as the seed script, packages/shared/src/roles.ts), one
   * region + site so the new tenant's dashboards aren't immediately empty,
   * and the initial TENANT_ADMIN account, all in one transaction.
   */
  async setup(dto: SetupTenantDto) {
    const existing = await this.prisma.user.findFirst({
      where: { email: dto.adminEmail },
    });
    if (existing) {
      throw new BadRequestException('هذا البريد الإلكتروني مستخدَم بالفعل');
    }

    const passwordHash = await bcrypt.hash(dto.adminPassword, 10);

    return this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: dto.name,
          nameAr: dto.nameAr,
          type: dto.type,
          primaryColor: dto.primaryColor,
          secondaryColor: dto.secondaryColor,
          locale: 'ar',
        },
      });

      const roles = await Promise.all(
        DEFAULT_ROLE_KEYS.map((key: RoleKey) =>
          tx.role.create({
            data: { tenantId: tenant.id, key, name: ROLE_LABELS_AR[key] },
          }),
        ),
      );
      const adminRole = roles.find((r) => r.key === 'TENANT_ADMIN')!;

      // Region/Site are RLS-protected. There's no authenticated request to
      // inherit a tenant context from at signup time, so this transaction
      // sets it explicitly to the tenant we just created — legitimate,
      // since everything we're about to insert genuinely belongs to it.
      await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenant.id}, true)`;

      const region = await tx.region.create({
        data: { tenantId: tenant.id, name: dto.regionName },
      });

      const site = await tx.site.create({
        data: {
          tenantId: tenant.id,
          regionId: region.id,
          name: dto.siteName,
          type: 'MAIN_BUILDING',
        },
      });

      const admin = await tx.user.create({
        data: {
          tenantId: tenant.id,
          roleId: adminRole.id,
          regionId: region.id,
          siteId: site.id,
          fullName: dto.adminFullName,
          email: dto.adminEmail,
          passwordHash,
        },
      });

      return {
        tenantId: tenant.id,
        adminEmail: admin.email,
      };
    });
  }
}
