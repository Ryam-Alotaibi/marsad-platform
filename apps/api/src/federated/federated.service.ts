import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';

export const RISK_MODEL_NAME = 'site-risk-predictor';
const MODEL_NAME = RISK_MODEL_NAME;
const MIN_SAMPLES_PER_TENANT = 10;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function weatherRiskComponent(tempC: number, aqi: number): number {
  let tempRisk: number;
  if (tempC < 25) tempRisk = 10;
  else if (tempC < 35) tempRisk = 35;
  else if (tempC < 40) tempRisk = 60;
  else if (tempC < 45) tempRisk = 80;
  else tempRisk = 95;
  return tempRisk * 0.7 + Math.min(100, aqi) * 0.3;
}

/** التسمية (label) الحقيقية المستخدمة للتدريب: مزيج معروف من الحمل والطقس، وليست بيانات مُلفَّقة. */
function computeRiskLabel(loadPct: number, tempC: number, aqi: number): number {
  return clamp(0.6 * loadPct + 0.4 * weatherRiskComponent(tempC, aqi), 0, 100);
}

interface TrainingSample {
  features: number[];
  label: number;
}

interface MlTenantResult {
  tenant_id: string;
  sample_count: number;
  local_accuracy_before: number;
  local_accuracy_after: number;
  weights_hash: string;
}

interface MlTrainResponse {
  global_weights: number[];
  global_bias: number;
  aggregate_accuracy: number;
  tenants: MlTenantResult[];
}

@Injectable()
export class FederatedService {
  private readonly logger = new Logger(FederatedService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly auditLog: AuditLogService,
  ) {}

  async join(tenantId: string) {
    return this.prisma.fLParticipation.upsert({
      where: { tenantId },
      update: { isActive: true },
      create: { tenantId, isActive: true },
    });
  }

  async leave(tenantId: string) {
    return this.prisma.fLParticipation.update({
      where: { tenantId },
      data: { isActive: false },
    });
  }

  async getStatus(tenantId: string) {
    const [participation, participatingTenantsCount, model, myLatestUpdate] =
      await Promise.all([
        this.prisma.fLParticipation.findUnique({ where: { tenantId } }),
        this.prisma.fLParticipation.count({ where: { isActive: true } }),
        this.prisma.fLModel.findFirst({ where: { name: MODEL_NAME } }),
        this.prisma.fLTenantUpdate.findFirst({
          where: { tenantId },
          orderBy: { submittedAt: 'desc' },
        }),
      ]);

    const rounds = model
      ? await this.prisma.fLRound.findMany({
          where: { modelId: model.id, completedAt: { not: null } },
          orderBy: { roundNumber: 'asc' },
          select: {
            roundNumber: true,
            aggregateAccuracy: true,
            completedAt: true,
          },
        })
      : [];

    const auditChain = await this.prisma.fLTenantUpdate.findMany({
      orderBy: { submittedAt: 'desc' },
      take: 10,
      include: { tenant: { select: { nameAr: true, type: true } } },
    });

    return {
      isParticipating: participation?.isActive ?? false,
      participatingTenantsCount,
      rounds,
      myLatestUpdate: myLatestUpdate
        ? {
            accuracyBefore: myLatestUpdate.accuracyBefore,
            accuracyAfter: myLatestUpdate.accuracyAfter,
            submittedAt: myLatestUpdate.submittedAt,
          }
        : null,
      auditChain: auditChain.map((row) => ({
        id: row.id,
        tenantName: row.tenant.nameAr,
        tenantType: row.tenant.type,
        weightsHash: row.weightsHash,
        auditHashSelf: row.auditHashSelf,
        submittedAt: row.submittedAt,
      })),
    };
  }

  private async gatherTrainingData(
    tenantId: string,
  ): Promise<TrainingSample[]> {
    const [powerReadings, weatherReadings] = await Promise.all([
      this.prisma.powerReading.findMany({ where: { site: { tenantId } } }),
      this.prisma.weatherReading.findMany({ where: { site: { tenantId } } }),
    ]);

    const weatherByKey = new Map(
      weatherReadings.map((w) => [`${w.siteId}_${w.recordedAt.getTime()}`, w]),
    );

    const samples: TrainingSample[] = [];
    for (const power of powerReadings) {
      const weather = weatherByKey.get(
        `${power.siteId}_${power.recordedAt.getTime()}`,
      );
      if (!weather) continue;

      const loadPct = (power.currentLoadKw / power.maxCapacityKw) * 100;
      samples.push({
        features: [
          loadPct,
          weather.temperatureC,
          weather.humidityPct,
          weather.aqi,
        ],
        label: computeRiskLabel(loadPct, weather.temperatureC, weather.aqi),
      });
    }
    return samples;
  }

  async runRound(triggeredByTenantId: string, triggeredByUserId: string) {
    const participations = await this.prisma.fLParticipation.findMany({
      where: { isActive: true },
      include: { tenant: { select: { id: true, nameAr: true } } },
    });

    if (participations.length === 0) {
      throw new BadRequestException('لا توجد جهات مشاركة بالشبكة حاليًا');
    }

    const tenantsPayload: { tenant_id: string; samples: TrainingSample[] }[] =
      [];
    for (const p of participations) {
      const samples = await this.gatherTrainingData(p.tenantId);
      if (samples.length >= MIN_SAMPLES_PER_TENANT) {
        tenantsPayload.push({ tenant_id: p.tenantId, samples });
      }
    }

    if (tenantsPayload.length === 0) {
      throw new BadRequestException(
        'لا توجد بيانات كافية لأي جهة مشاركة لتدريب النموذج',
      );
    }

    const mlUrl = this.config.get<string>(
      'ML_SERVICE_URL',
      'http://localhost:8000',
    );
    const res = await fetch(`${mlUrl}/federated/train-and-aggregate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenants: tenantsPayload }),
    });

    if (!res.ok) {
      const text = await res.text();
      this.logger.error(`ML service error: ${text}`);
      throw new BadRequestException(
        'تعذّر تدريب النموذج عبر خدمة الذكاء الاصطناعي',
      );
    }

    const result = (await res.json()) as MlTrainResponse;

    const weightsRef = JSON.stringify({
      weights: result.global_weights,
      bias: result.global_bias,
      featureOrder: ['loadPct', 'temperatureC', 'humidityPct', 'aqi'],
    });

    const model = await this.prisma.fLModel.upsert({
      where: { name_version: { name: MODEL_NAME, version: 'v1' } },
      update: { globalWeightsRef: weightsRef },
      create: {
        name: MODEL_NAME,
        version: 'v1',
        taskType: 'REGRESSION',
        globalWeightsRef: weightsRef,
      },
    });

    const lastRound = await this.prisma.fLRound.findFirst({
      where: { modelId: model.id },
      orderBy: { roundNumber: 'desc' },
    });

    const round = await this.prisma.fLRound.create({
      data: {
        modelId: model.id,
        roundNumber: (lastRound?.roundNumber ?? 0) + 1,
      },
    });

    for (const tenantResult of result.tenants) {
      const lastAudit = await this.prisma.fLTenantUpdate.findFirst({
        orderBy: { submittedAt: 'desc' },
      });
      const prevHash = lastAudit?.auditHashSelf ?? 'GENESIS';
      const selfHash = createHash('sha256')
        .update(
          `${tenantResult.tenant_id}:${round.id}:${tenantResult.weights_hash}:${prevHash}:${Date.now()}`,
        )
        .digest('hex');

      await this.prisma.fLTenantUpdate.create({
        data: {
          roundId: round.id,
          tenantId: tenantResult.tenant_id,
          accuracyBefore: tenantResult.local_accuracy_before,
          accuracyAfter: tenantResult.local_accuracy_after,
          weightsHash: tenantResult.weights_hash,
          auditHashPrev: prevHash,
          auditHashSelf: selfHash,
        },
      });
    }

    await this.prisma.fLRound.update({
      where: { id: round.id },
      data: {
        completedAt: new Date(),
        aggregateAccuracy: result.aggregate_accuracy,
      },
    });

    await Promise.all(
      result.tenants.map((t) =>
        this.auditLog.record({
          tenantId: t.tenant_id,
          actorUserId: t.tenant_id === triggeredByTenantId ? triggeredByUserId : null,
          action: 'RUN_FEDERATED_ROUND',
          entityType: 'FLRound',
          entityId: round.id,
          metadata: {
            roundNumber: round.roundNumber,
            accuracyBefore: t.local_accuracy_before,
            accuracyAfter: t.local_accuracy_after,
            triggeredByThisTenant: t.tenant_id === triggeredByTenantId,
          },
        }),
      ),
    );

    return {
      roundNumber: round.roundNumber,
      aggregateAccuracy: result.aggregate_accuracy,
      participatingTenants: result.tenants.map((t) => ({
        tenantId: t.tenant_id,
        tenantName: participations.find((p) => p.tenantId === t.tenant_id)
          ?.tenant.nameAr,
        sampleCount: t.sample_count,
        accuracyBefore: t.local_accuracy_before,
        accuracyAfter: t.local_accuracy_after,
      })),
    };
  }
}
