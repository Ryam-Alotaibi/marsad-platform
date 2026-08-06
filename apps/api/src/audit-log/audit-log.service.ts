import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

interface RecordAuditEntry {
  tenantId: string;
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Opens its own short transaction and sets the tenant session variable
   * itself, rather than relying on TenantContextInterceptor's ambient
   * request-scoped transaction. This lets record() be called safely from
   * anywhere — including pre-auth flows like login, where no request-scoped
   * tenant context exists yet — without tripping the audit_logs RLS policy.
   */
  async record(entry: RecordAuditEntry): Promise<void> {
    await this.prisma.client.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${entry.tenantId}, true)`;
      await tx.auditLog.create({
        data: {
          tenantId: entry.tenantId,
          actorUserId: entry.actorUserId ?? null,
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId,
          metadata: (entry.metadata ?? {}) as Prisma.InputJsonValue,
        },
      });
    });
  }

  async list(tenantId: string) {
    return this.prisma.auditLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { actor: { select: { fullName: true } } },
    });
  }
}
