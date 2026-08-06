import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import type { CreateSupportAlertDto } from './dto/create-alert.dto';

@Injectable()
export class SupportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  findTeam(tenantId: string) {
    return this.prisma.user.findMany({
      where: {
        tenantId,
        role: {
          key: {
            in: ['SUPPORT_ENGINEER', 'OPERATIONS_CENTER', 'SITE_MANAGER'],
          },
        },
      },
      include: { role: { select: { key: true, name: true } } },
      orderBy: [{ availabilityStatus: 'asc' }, { fullName: 'asc' }],
    });
  }

  findEscalationRules(tenantId: string) {
    return this.prisma.escalationRule.findMany({
      where: { tenantId },
      orderBy: { level: 'asc' },
    });
  }

  private async findAvailableEngineer(tenantId: string) {
    const candidates = await this.prisma.user.findMany({
      where: {
        tenantId,
        availabilityStatus: 'AVAILABLE',
        role: { key: { in: ['SUPPORT_ENGINEER', 'OPERATIONS_CENTER'] } },
      },
      include: { role: { select: { key: true, name: true } } },
    });

    return (
      candidates.find((c) => c.role.key === 'SUPPORT_ENGINEER') ??
      candidates[0] ??
      null
    );
  }

  async createAlert(
    tenantId: string,
    actorUserId: string,
    dto: CreateSupportAlertDto,
  ) {
    const alert = await this.prisma.alert.create({
      data: {
        tenantId,
        title: dto.title,
        description: dto.description,
        severity: dto.severity,
        category: dto.category,
      },
    });

    const assignedUser = await this.findAvailableEngineer(tenantId);

    await this.prisma.escalationLog.create({
      data: {
        alertId: alert.id,
        level: 1,
        notifiedUserIds: assignedUser ? [assignedUser.id] : [],
      },
    });

    await this.auditLog.record({
      tenantId,
      actorUserId,
      action: 'CREATE_ALERT',
      entityType: 'Alert',
      entityId: alert.id,
      metadata: { severity: alert.severity, category: alert.category },
    });

    return {
      alert,
      assignedUser: assignedUser
        ? {
            id: assignedUser.id,
            fullName: assignedUser.fullName,
            roleName: assignedUser.role.name,
          }
        : null,
    };
  }
}
