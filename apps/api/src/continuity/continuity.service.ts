import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { ContinuityActionType, ScheduledServiceType } from '@prisma/client';
import { SCHEDULED_SERVICE_TYPE_LABELS_AR } from '@marsad/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import type { EvaluateContinuityDto } from './dto/evaluate-continuity.dto';
import type { ApplyContinuityActionDto } from './dto/apply-continuity-action.dto';

const SEVERITY_THRESHOLD = 70;
const SEVERITY_CRITICAL = 90;
const SCENARIO_LOOKAHEAD_HOURS = 72;

interface AffectedSite {
  siteId: string;
  siteName: string;
  severity: number;
}

function severityLabel(score: number): string {
  if (score >= SEVERITY_CRITICAL) return 'حرجة';
  if (score >= SEVERITY_THRESHOLD) return 'مرتفعة';
  return 'متوسطة';
}

function decideAction(
  type: ScheduledServiceType,
  severity: number,
  hasAlternateSite: boolean,
): ContinuityActionType | null {
  if (severity < SEVERITY_THRESHOLD) return null;

  if (severity >= SEVERITY_CRITICAL) {
    if (type === 'TRANSACTION') return hasAlternateSite ? 'RE_ROUTED' : 'REMOTE';
    if (type === 'APPOINTMENT') return 'REMOTE';
    return hasAlternateSite ? 'RE_ROUTED' : 'CANCELLED'; // HEARING
  }

  if (type === 'HEARING') return hasAlternateSite ? 'RE_ROUTED' : 'REMOTE';
  return 'REMOTE'; // APPOINTMENT / TRANSACTION
}

function composeReason(
  type: ScheduledServiceType,
  action: ContinuityActionType,
  severity: number,
  siteName: string,
  altSiteName: string | null,
): string {
  const typeLabel = SCHEDULED_SERVICE_TYPE_LABELS_AR[type] ?? type;
  const base = `خطورة متوقعة ${severity}% (${severityLabel(severity)}) في ${siteName}`;

  switch (action) {
    case 'REMOTE':
      return `${base} تستدعي تحويل هذه الخدمة (${typeLabel}) لعقدها عن بُعد لتفادي تعطلها عند وقوع العطل.`;
    case 'RE_ROUTED':
      return `${base} تستدعي إعادة توجيه المستفيد إلى ${altSiteName ?? 'موقع بديل'} الأقل تأثرًا بدل تعطيل الخدمة بالكامل.`;
    case 'CANCELLED':
      return `${base}، مع عدم توفر موقع بديل مناسب أو إمكانية تنفيذ هذا النوع من الخدمة (${typeLabel}) عن بُعد، ما يستدعي الإلغاء وإعادة الجدولة.`;
  }
}

@Injectable()
export class ContinuityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async listScheduledServices(tenantId: string) {
    // Not filtered to scheduledAt >= now: seed data has fixed timestamps
    // relative to whenever `prisma db seed` last ran, so a "future only"
    // filter would silently go empty once enough real time has passed —
    // showing the demo data regardless of date keeps this page reliable no
    // matter when it's viewed.
    const services = await this.prisma.scheduledService.findMany({
      where: { tenantId },
      orderBy: { scheduledAt: 'asc' },
      include: { site: { select: { name: true } } },
    });

    return services.map((s) => ({
      id: s.id,
      type: s.type,
      siteName: s.site.name,
      scheduledAt: s.scheduledAt,
      beneficiaryContact: s.beneficiaryContact,
    }));
  }

  private async findAlternateSite(tenantId: string, siteId: string) {
    const site = await this.prisma.site.findFirst({ where: { id: siteId, tenantId } });
    if (!site) return null;

    const candidates = await this.prisma.site.findMany({
      where: { tenantId, regionId: site.regionId, id: { not: siteId } },
      include: { _count: { select: { alerts: { where: { status: 'OPEN' } } } } },
    });

    if (candidates.length === 0) return null;
    candidates.sort((a, b) => a._count.alerts - b._count.alerts);
    return candidates[0];
  }

  private async resolveAffectedSites(
    tenantId: string,
    dto: EvaluateContinuityDto,
  ): Promise<{ sites: AffectedSite[]; windowStart: Date; windowEnd: Date }> {
    if (dto.sourceType === 'PREDICTION') {
      const prediction = await this.prisma.prediction.findFirst({
        where: { id: dto.sourceId, tenantId },
        include: { site: { select: { name: true } } },
      });
      if (!prediction) throw new NotFoundException('التنبؤ غير موجود');
      if (!prediction.siteId || !prediction.site) {
        throw new BadRequestException('هذا التنبؤ غير مرتبط بموقع محدد');
      }

      return {
        sites: [
          {
            siteId: prediction.siteId,
            siteName: prediction.site.name,
            severity: prediction.confidencePct,
          },
        ],
        windowStart: prediction.windowStart,
        windowEnd: prediction.windowEnd,
      };
    }

    const scenario = await this.prisma.scenarioRun.findFirst({
      where: { id: dto.sourceId, tenantId },
      include: { impacts: { include: { affectedSite: { select: { name: true } } } } },
    });
    if (!scenario) throw new NotFoundException('السيناريو غير موجود');

    const severity = scenario.impactScore ?? 0;
    const now = new Date();
    return {
      sites: scenario.impacts.map((impact) => ({
        siteId: impact.affectedSiteId,
        siteName: impact.affectedSite.name,
        severity,
      })),
      windowStart: now,
      windowEnd: new Date(now.getTime() + SCENARIO_LOOKAHEAD_HOURS * 60 * 60 * 1000),
    };
  }

  async evaluate(tenantId: string, dto: EvaluateContinuityDto) {
    const { sites, windowStart, windowEnd } = await this.resolveAffectedSites(tenantId, dto);
    const proposals: Array<{
      scheduledServiceId: string;
      type: ScheduledServiceType;
      siteName: string;
      scheduledAt: Date;
      beneficiaryContact: string;
      severity: number;
      recommendedAction: ContinuityActionType;
      reason: string;
      alreadyApplied: boolean;
    }> = [];

    for (const site of sites) {
      const services = await this.prisma.scheduledService.findMany({
        where: {
          tenantId,
          siteId: site.siteId,
          scheduledAt: { gte: windowStart, lte: windowEnd },
        },
        include: {
          continuityActions:
            dto.sourceType === 'PREDICTION'
              ? { where: { predictionId: dto.sourceId } }
              : { where: { scenarioRunId: dto.sourceId } },
        },
      });

      if (services.length === 0) continue;
      if (site.severity < SEVERITY_THRESHOLD) continue;

      const alternate = await this.findAlternateSite(tenantId, site.siteId);

      for (const service of services) {
        const perServiceAction = decideAction(service.type, site.severity, !!alternate);
        if (!perServiceAction) continue;

        proposals.push({
          scheduledServiceId: service.id,
          type: service.type,
          siteName: site.siteName,
          scheduledAt: service.scheduledAt,
          beneficiaryContact: service.beneficiaryContact,
          severity: site.severity,
          recommendedAction: perServiceAction,
          reason: composeReason(
            service.type,
            perServiceAction,
            site.severity,
            site.siteName,
            alternate?.name ?? null,
          ),
          alreadyApplied: service.continuityActions.length > 0,
        });
      }
    }

    return proposals.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
  }

  private renderNotification(
    type: ScheduledServiceType,
    action: ContinuityActionType,
    scheduledAt: Date,
  ): string {
    const typeLabel = SCHEDULED_SERVICE_TYPE_LABELS_AR[type] ?? type;
    const when = new Intl.DateTimeFormat('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
      day: 'numeric',
      month: 'short',
    }).format(scheduledAt);

    switch (action) {
      case 'REMOTE':
        return `عزيزي المستفيد، تم تحويل ${typeLabel} المجدولة لديك بتاريخ ${when} لتُعقد عن بُعد بسبب ظرف تشغيلي طارئ. سيصلك رابط الاتصال قبل الموعد.`;
      case 'RE_ROUTED':
        return `عزيزي المستفيد، تم إعادة توجيه ${typeLabel} المجدولة لديك بتاريخ ${when} إلى موقع بديل أقرب استقرارًا. يرجى مراجعة تفاصيل الموقع الجديد.`;
      case 'CANCELLED':
        return `عزيزي المستفيد، تعذّر عقد ${typeLabel} المجدولة لديك بتاريخ ${when} بسبب ظرف تشغيلي طارئ. سيتم التواصل معك لإعادة الجدولة.`;
    }
  }

  async apply(tenantId: string, actorUserId: string, dto: ApplyContinuityActionDto) {
    const service = await this.prisma.scheduledService.findFirst({
      where: { id: dto.scheduledServiceId, tenantId },
    });
    if (!service) throw new NotFoundException('الخدمة المجدولة غير موجودة');

    if (dto.sourceType === 'PREDICTION') {
      const prediction = await this.prisma.prediction.findFirst({
        where: { id: dto.sourceId, tenantId },
      });
      if (!prediction) throw new NotFoundException('التنبؤ غير موجود');
    } else {
      const scenario = await this.prisma.scenarioRun.findFirst({
        where: { id: dto.sourceId, tenantId },
      });
      if (!scenario) throw new NotFoundException('السيناريو غير موجود');
    }

    const action = await this.prisma.continuityAction.create({
      data: {
        sourceType: dto.sourceType,
        predictionId: dto.sourceType === 'PREDICTION' ? dto.sourceId : null,
        scenarioRunId: dto.sourceType === 'SCENARIO' ? dto.sourceId : null,
        scheduledServiceId: dto.scheduledServiceId,
        actionTaken: dto.actionTaken,
        notifiedAt: new Date(),
      },
    });

    await this.auditLog.record({
      tenantId,
      actorUserId,
      action: 'APPLY_CONTINUITY_ACTION',
      entityType: 'ContinuityAction',
      entityId: action.id,
      metadata: { actionTaken: dto.actionTaken, scheduledServiceId: dto.scheduledServiceId },
    });

    return {
      action,
      notificationPreview: this.renderNotification(
        service.type,
        dto.actionTaken,
        service.scheduledAt,
      ),
    };
  }

  async listActions(tenantId: string) {
    const actions = await this.prisma.continuityAction.findMany({
      where: { scheduledService: { tenantId } },
      orderBy: { createdAt: 'desc' },
      include: {
        scheduledService: { include: { site: { select: { name: true } } } },
        prediction: { select: { title: true } },
        scenarioRun: { select: { impactScore: true, rootCauseExplanation: true } },
      },
    });

    return actions.map((a) => ({
      id: a.id,
      sourceType: a.sourceType,
      sourceLabel: a.prediction?.title ?? (a.scenarioRun ? `سيناريو محاكاة (${a.scenarioRun.impactScore}%)` : null),
      serviceType: a.scheduledService.type,
      siteName: a.scheduledService.site.name,
      scheduledAt: a.scheduledService.scheduledAt,
      beneficiaryContact: a.scheduledService.beneficiaryContact,
      actionTaken: a.actionTaken,
      notifiedAt: a.notifiedAt,
      createdAt: a.createdAt,
    }));
  }
}
