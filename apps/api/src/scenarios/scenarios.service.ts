import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { RISK_MODEL_NAME } from '../federated/federated.service';
import type { RunScenarioDto } from './dto/run-scenario.dto';

const SWEEP_COUNT = 25;
const SWEEP_IMPACT_THRESHOLD = 90;
const NOVELTY_ROUNDING = 10;

export interface ScenarioFactors {
  temperatureC: number;
  loadPct: number;
  humidityPct: number;
  aqi: number;
  powerOutageHours: number;
  suspiciousLoginAttempts: number;
}

function toInputJson(factors: ScenarioFactors): Prisma.InputJsonValue {
  return { ...factors };
}

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

function randomInRange(min: number, max: number): number {
  return Math.round(min + Math.random() * (max - min));
}

/** أغلب القراءات ضمن النطاق الطبيعي، مع احتمال أقل لارتفاع استثنائي — يحاكي واقع القراءات التشغيلية. */
function maybeSpike(
  normalMin: number,
  normalMax: number,
  spikeMin: number,
  spikeMax: number,
  spikeChance: number,
): number {
  return Math.random() < spikeChance
    ? randomInRange(spikeMin, spikeMax)
    : randomInRange(normalMin, normalMax);
}

function randomFactors(): ScenarioFactors {
  return {
    temperatureC: maybeSpike(20, 36, 37, 50, 0.2),
    loadPct: maybeSpike(30, 80, 81, 125, 0.2),
    humidityPct: randomInRange(20, 70),
    aqi: maybeSpike(30, 110, 111, 250, 0.15),
    powerOutageHours: Math.random() < 0.2 ? randomInRange(1, 8) : 0,
    suspiciousLoginAttempts:
      Math.random() < 0.2 ? randomInRange(10, 50) : randomInRange(0, 5),
  };
}

@Injectable()
export class ScenariosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  private async loadModelWeights(): Promise<{
    weights: number[] | null;
    bias: number;
  }> {
    const model = await this.prisma.fLModel.findFirst({
      where: { name: RISK_MODEL_NAME },
    });
    if (!model?.globalWeightsRef) return { weights: null, bias: 0 };
    try {
      const parsed = JSON.parse(model.globalWeightsRef) as {
        weights: number[];
        bias: number;
      };
      return { weights: parsed.weights, bias: parsed.bias };
    } catch {
      return { weights: null, bias: 0 };
    }
  }

  private predictBaseRisk(
    weights: number[] | null,
    bias: number,
    factors: ScenarioFactors,
  ): number {
    if (weights) {
      const value =
        weights[0] * factors.loadPct +
        weights[1] * factors.temperatureC +
        weights[2] * factors.humidityPct +
        weights[3] * factors.aqi +
        bias;
      return clamp(value, 0, 100);
    }
    // بديل احتياطي: نفس الصيغة المستخدمة قبل توفّر نموذج مُدرَّب فعليًا (مرحلة 5)
    return clamp(
      0.6 * factors.loadPct +
        0.4 * weatherRiskComponent(factors.temperatureC, factors.aqi),
      0,
      100,
    );
  }

  private async computeSiteImpacts(tenantId: string, factors: ScenarioFactors) {
    const { weights, bias } = await this.loadModelWeights();
    const baseRisk = this.predictBaseRisk(weights, bias, factors);

    const outageBoost = Math.min(40, factors.powerOutageHours * 5);
    const cyberBoost =
      factors.suspiciousLoginAttempts > 20
        ? 20
        : factors.suspiciousLoginAttempts > 5
          ? 8
          : 0;

    const sites = await this.prisma.site.findMany({
      where: { tenantId },
      include: {
        _count: { select: { alerts: { where: { status: 'OPEN' } } } },
      },
    });

    const results = sites
      .map((site) => {
        const ageModifier =
          1 + Math.min(0.5, site.infrastructureAgeYears * 0.01);
        const combined =
          Math.round(
            clamp(baseRisk * ageModifier + outageBoost + cyberBoost, 0, 100) *
              10,
          ) / 10;

        let affectedService = 'تباطؤ الأداء العام';
        if (outageBoost >= cyberBoost && outageBoost > 10) {
          affectedService = 'انقطاع الخدمات الكهربائية والتبريد';
        } else if (cyberBoost > 10) {
          affectedService = 'مخاطر أمنية وتعطل الأنظمة';
        }

        const estimatedCost = Math.round(
          combined * 500 * (site.type === 'MAIN_BUILDING' ? 1.5 : 1),
        );

        return {
          siteId: site.id,
          siteName: site.name,
          combined,
          affectedService,
          estimatedCost,
        };
      })
      .sort((a, b) => b.combined - a.combined);

    const impactScore = results[0]?.combined ?? 0;
    return { results, impactScore, outageBoost, cyberBoost };
  }

  private async isNovel(
    tenantId: string,
    factors: ScenarioFactors,
  ): Promise<boolean> {
    const priorRuns = await this.prisma.scenarioRun.findMany({
      where: { tenantId },
      select: { inputFactors: true },
    });

    const round = (v: number) =>
      Math.round(v / NOVELTY_ROUNDING) * NOVELTY_ROUNDING;
    return !priorRuns.some((run) => {
      const prior = run.inputFactors as unknown as ScenarioFactors;
      return (
        round(prior.temperatureC) === round(factors.temperatureC) &&
        round(prior.loadPct) === round(factors.loadPct) &&
        round(prior.powerOutageHours) === round(factors.powerOutageHours) &&
        round(prior.suspiciousLoginAttempts) ===
          round(factors.suspiciousLoginAttempts)
      );
    });
  }

  private composeRootCause(
    factors: ScenarioFactors,
    outageBoost: number,
    cyberBoost: number,
  ): string {
    const clauses: string[] = [];

    if (factors.temperatureC >= 40 && outageBoost > 0) {
      clauses.push(
        `درجة حرارة ${factors.temperatureC}° مع انقطاع كهرباء لمدة ${factors.powerOutageHours} ساعة يعطّل أنظمة التبريد في وقت الذروة الحرارية، ما يسرّع خطر الفشل الحراري للمعدات`,
      );
    } else if (outageBoost > 0) {
      clauses.push(
        `انقطاع الكهرباء لمدة ${factors.powerOutageHours} ساعة يوقف الأنظمة الحرجة ويستنزف شحن UPS تدريجيًا`,
      );
    } else if (factors.temperatureC >= 40) {
      clauses.push(
        `درجة الحرارة المرتفعة (${factors.temperatureC}°) وحدها تزيد حمل أنظمة التبريد وتقلّل كفاءتها`,
      );
    }

    if (cyberBoost > 0) {
      const timing =
        outageBoost > 0
          ? 'تتزامن مع فترة الانقطاع، ما يرفع احتمال استغلال ضعف المراقبة أثناء الطوارئ'
          : 'ترفع احتمال محاولة اختراق فعلية';
      clauses.push(
        `${factors.suspiciousLoginAttempts} محاولة دخول مشبوهة ${timing}`,
      );
    }

    if (factors.loadPct >= 90) {
      clauses.push(
        `الحمل الكهربائي عند ${factors.loadPct}% من السعة القصوى يترك هامش أمان ضئيلًا لأي ارتفاع إضافي`,
      );
    }

    if (clauses.length === 0) {
      return 'التركيبة ضمن النطاق الطبيعي تقريبًا، ولا يوجد عامل واحد يهيمن على درجة الخطورة.';
    }

    return `${clauses.join('، كما أن ')}.`;
  }

  private async persistRun(
    tenantId: string,
    triggeredBy: 'MANUAL' | 'NIGHTLY_SWEEPER',
    factors: ScenarioFactors,
    novel: boolean,
    impactScore: number,
    rootCause: string,
    siteResults: Awaited<
      ReturnType<ScenariosService['computeSiteImpacts']>
    >['results'],
  ) {
    const run = await this.prisma.scenarioRun.create({
      data: {
        tenantId,
        triggeredBy,
        inputFactors: toInputJson(factors),
        isNovel: novel,
        impactScore,
        rootCauseExplanation: rootCause,
        status: 'COMPLETED',
      },
    });

    await Promise.all(
      siteResults.map((r, idx) =>
        this.prisma.scenarioImpact.create({
          data: {
            scenarioRunId: run.id,
            affectedSiteId: r.siteId,
            affectedService: r.affectedService,
            estimatedCost: r.estimatedCost,
            cascadeStep: idx + 1,
          },
        }),
      ),
    );

    return { run, siteResults };
  }

  async runWhatIf(tenantId: string, dto: RunScenarioDto) {
    const { results, impactScore, outageBoost, cyberBoost } =
      await this.computeSiteImpacts(tenantId, dto);
    const novel = await this.isNovel(tenantId, dto);
    const rootCause = this.composeRootCause(dto, outageBoost, cyberBoost);

    const { run, siteResults } = await this.persistRun(
      tenantId,
      'MANUAL',
      dto,
      novel,
      impactScore,
      rootCause,
      results,
    );

    return {
      id: run.id,
      isNovel: run.isNovel,
      impactScore: run.impactScore,
      rootCauseExplanation: run.rootCauseExplanation,
      impacts: siteResults.map((r, idx) => ({ ...r, cascadeStep: idx + 1 })),
    };
  }

  async runNightlySweep(tenantId: string) {
    const discovered: {
      id: string;
      impactScore: number;
      rootCauseExplanation: string | null;
      inputFactors: ScenarioFactors;
    }[] = [];

    for (let i = 0; i < SWEEP_COUNT; i++) {
      const factors = randomFactors();
      const novel = await this.isNovel(tenantId, factors);
      if (!novel) continue;

      const { results, impactScore, outageBoost, cyberBoost } =
        await this.computeSiteImpacts(tenantId, factors);
      if (impactScore < SWEEP_IMPACT_THRESHOLD) continue;

      const rootCause = this.composeRootCause(factors, outageBoost, cyberBoost);
      const { run } = await this.persistRun(
        tenantId,
        'NIGHTLY_SWEEPER',
        factors,
        true,
        impactScore,
        rootCause,
        results,
      );

      discovered.push({
        id: run.id,
        impactScore: run.impactScore ?? 0,
        rootCauseExplanation: run.rootCauseExplanation,
        inputFactors: factors,
      });
    }

    return { scanned: SWEEP_COUNT, discovered };
  }

  async listScenarios(tenantId: string) {
    const runs = await this.prisma.scenarioRun.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: {
        impacts: {
          include: { affectedSite: { select: { name: true } } },
          orderBy: { cascadeStep: 'asc' },
        },
      },
    });

    return runs.map((run) => ({
      id: run.id,
      triggeredBy: run.triggeredBy,
      isNovel: run.isNovel,
      impactScore: run.impactScore,
      rootCauseExplanation: run.rootCauseExplanation,
      createdAt: run.createdAt,
      impacts: run.impacts.map((i) => ({
        siteName: i.affectedSite.name,
        affectedService: i.affectedService,
        estimatedCost: i.estimatedCost,
        cascadeStep: i.cascadeStep,
      })),
    }));
  }

  async freezePlaybook(
    tenantId: string,
    actorUserId: string,
    scenarioRunId: string,
    name: string,
  ) {
    const scenario = await this.prisma.scenarioRun.findFirst({
      where: { id: scenarioRunId, tenantId },
    });
    if (!scenario) throw new NotFoundException('السيناريو غير موجود');

    const playbook = await this.prisma.playbook.create({
      data: { tenantId, scenarioRunId, name, isFrozen: true },
    });

    await this.auditLog.record({
      tenantId,
      actorUserId,
      action: 'FREEZE_PLAYBOOK',
      entityType: 'Playbook',
      entityId: playbook.id,
      metadata: { name, scenarioRunId },
    });

    return playbook;
  }

  async listPlaybooks(tenantId: string) {
    return this.prisma.playbook.findMany({
      where: { tenantId },
      orderBy: { id: 'desc' },
      include: {
        scenarioRun: {
          select: { impactScore: true, rootCauseExplanation: true },
        },
      },
    });
  }

  async activatePlaybook(
    tenantId: string,
    actorUserId: string,
    playbookId: string,
  ) {
    const playbook = await this.prisma.playbook.findFirst({
      where: { id: playbookId, tenantId },
    });
    if (!playbook) throw new NotFoundException('خطة الطوارئ غير موجودة');

    const activated = await this.prisma.playbook.update({
      where: { id: playbookId },
      data: { activatedAt: new Date() },
    });

    await this.auditLog.record({
      tenantId,
      actorUserId,
      action: 'ACTIVATE_PLAYBOOK',
      entityType: 'Playbook',
      entityId: playbookId,
      metadata: { name: playbook.name },
    });

    return activated;
  }
}
