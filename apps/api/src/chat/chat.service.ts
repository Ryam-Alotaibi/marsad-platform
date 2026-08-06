import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LlmProvider } from './providers/llm.provider';
import type { Prisma } from '@prisma/client';

type Intent =
  'POWER' | 'PREDICTIONS' | 'ALERTS' | 'WEATHER' | 'IOT' | 'GENERAL';

const INTENT_KEYWORDS: Record<Exclude<Intent, 'GENERAL'>, string[]> = {
  POWER: ['كهرباء', 'حمل', 'طاقة', 'مولد', 'UPS', 'فولت'],
  PREDICTIONS: ['تنبؤ', 'توقع', 'متوقع'],
  ALERTS: ['تنبيه', 'تنبيهات', 'خطر', 'مخاطر', 'حرج'],
  WEATHER: ['طقس', 'حرارة', 'رطوبة', 'درجة'],
  IOT: ['مستشعر', 'استشعار', 'تسرب', 'co2', 'جودة الهواء', 'aqi'],
};

function detectIntent(message: string): Intent {
  const lower = message.toLowerCase();
  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k.toLowerCase()))) {
      return intent as Intent;
    }
  }
  return 'GENERAL';
}

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly llm: LlmProvider,
  ) {}

  async createConversation(tenantId: string, userId: string) {
    return this.prisma.chatConversation.create({ data: { tenantId, userId } });
  }

  async getMessages(tenantId: string, conversationId: string) {
    const conversation = await this.prisma.chatConversation.findFirst({
      where: { id: conversationId, tenantId },
    });
    if (!conversation) throw new NotFoundException('المحادثة غير موجودة');

    return this.prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });
  }

  private async buildPowerAnswer(
    tenantId: string,
  ): Promise<{ text: string; refs: Prisma.InputJsonObject }> {
    const sites = await this.prisma.site.findMany({
      where: { tenantId },
      include: { powerReadings: { orderBy: { recordedAt: 'desc' }, take: 1 } },
    });
    const withReadings = sites
      .map((s) => ({ name: s.name, reading: s.powerReadings[0] }))
      .filter(
        (s): s is { name: string; reading: NonNullable<typeof s.reading> } =>
          !!s.reading,
      );

    if (withReadings.length === 0) {
      return { text: 'لا توجد قراءات كهربائية كافية حاليًا.', refs: {} };
    }

    const withPct = withReadings.map((s) => ({
      ...s,
      pct: (s.reading.currentLoadKw / s.reading.maxCapacityKw) * 100,
    }));
    const highest = withPct.reduce((a, b) => (b.pct > a.pct ? b : a));
    const avgPct = withPct.reduce((sum, s) => sum + s.pct, 0) / withPct.length;

    return {
      text: `متوسط الحمل الكهربائي حاليًا ${avgPct.toFixed(0)}% عبر كل المواقع. أعلى حمل مسجَّل في "${highest.name}" بنسبة ${highest.pct.toFixed(0)}% (${highest.reading.currentLoadKw.toFixed(0)}/${highest.reading.maxCapacityKw.toFixed(0)} kW)، وشحن UPS هناك ${highest.reading.upsChargePct.toFixed(0)}%.`,
      refs: { intent: 'POWER', siteChecked: highest.name },
    };
  }

  private async buildPredictionsAnswer(
    tenantId: string,
  ): Promise<{ text: string; refs: Prisma.InputJsonObject }> {
    const predictions = await this.prisma.prediction.findMany({
      where: { tenantId, status: 'ACTIVE' },
      orderBy: { confidencePct: 'desc' },
      take: 1,
    });

    const count = await this.prisma.prediction.count({
      where: { tenantId, status: 'ACTIVE' },
    });
    if (count === 0) {
      return {
        text: 'لا توجد تنبؤات نشطة حاليًا — كل الأنظمة ضمن النطاق الطبيعي.',
        refs: { intent: 'PREDICTIONS', count: 0 },
      };
    }

    const top = predictions[0];
    return {
      text: `يوجد حاليًا ${count} تنبؤ نشط. الأعلى ثقة: "${top.title}" بنسبة ثقة ${top.confidencePct}%، والسبب الجذري: ${top.rootCause}`,
      refs: { intent: 'PREDICTIONS', count, topPredictionId: top.id },
    };
  }

  private async buildAlertsAnswer(
    tenantId: string,
  ): Promise<{ text: string; refs: Prisma.InputJsonObject }> {
    const [critical, warning, info] = await Promise.all([
      this.prisma.alert.count({
        where: { tenantId, status: 'OPEN', severity: 'CRITICAL' },
      }),
      this.prisma.alert.count({
        where: { tenantId, status: 'OPEN', severity: 'WARNING' },
      }),
      this.prisma.alert.count({
        where: { tenantId, status: 'OPEN', severity: 'INFO' },
      }),
    ]);
    const total = critical + warning + info;
    if (total === 0) {
      return {
        text: 'لا توجد تنبيهات مفتوحة حاليًا.',
        refs: { intent: 'ALERTS', total: 0 },
      };
    }
    return {
      text: `يوجد ${total} تنبيه مفتوح: ${critical} حرج، ${warning} تحذير، ${info} معلوماتي. يُنصح بمراجعة التنبيهات الحرجة أولًا من شاشة التنبيهات والمخاطر.`,
      refs: { intent: 'ALERTS', critical, warning, info },
    };
  }

  private async buildWeatherAnswer(
    tenantId: string,
  ): Promise<{ text: string; refs: Prisma.InputJsonObject }> {
    const sites = await this.prisma.site.findMany({
      where: { tenantId },
      include: {
        weatherReadings: { orderBy: { recordedAt: 'desc' }, take: 1 },
      },
    });
    const withReadings = sites
      .map((s) => ({ name: s.name, reading: s.weatherReadings[0] }))
      .filter(
        (s): s is { name: string; reading: NonNullable<typeof s.reading> } =>
          !!s.reading,
      );

    if (withReadings.length === 0) {
      return { text: 'لا توجد قراءات طقس كافية حاليًا.', refs: {} };
    }

    const hottest = withReadings.reduce((a, b) =>
      b.reading.temperatureC > a.reading.temperatureC ? b : a,
    );
    const avgTemp =
      withReadings.reduce((sum, s) => sum + s.reading.temperatureC, 0) /
      withReadings.length;

    return {
      text: `متوسط درجة الحرارة الحالية ${avgTemp.toFixed(1)}° عبر المواقع. أعلى درجة حرارة مسجَّلة في "${hottest.name}" بـ${hottest.reading.temperatureC.toFixed(1)}° ورطوبة ${hottest.reading.humidityPct.toFixed(0)}%.`,
      refs: { intent: 'WEATHER', hottestSite: hottest.name },
    };
  }

  private async buildIotAnswer(
    tenantId: string,
  ): Promise<{ text: string; refs: Prisma.InputJsonObject }> {
    const sensors = await this.prisma.sensor.findMany({
      where: { site: { tenantId } },
      include: {
        site: { select: { name: true } },
        readings: { orderBy: { recordedAt: 'desc' }, take: 1 },
      },
    });

    const leaks = sensors.filter(
      (s) => s.type === 'WATER_LEAK' && (s.readings[0]?.value ?? 0) > 0,
    );
    if (leaks.length > 0) {
      const names = leaks.map((l) => l.site.name).join('، ');
      return {
        text: `تحذير: تم رصد تسرب مياه محتمل في: ${names}. يُنصح بإرسال فريق الدعم الفني فورًا.`,
        refs: { intent: 'IOT', waterLeakSites: leaks.map((l) => l.siteId) },
      };
    }

    return {
      text: 'لا توجد حالات تسرب مياه مرصودة حاليًا، وكل مستشعرات جودة الهواء وثاني أكسيد الكربون ضمن النطاق الطبيعي أو تحت المراقبة.',
      refs: { intent: 'IOT' },
    };
  }

  private async buildGeneralAnswer(
    tenantId: string,
  ): Promise<{ text: string; refs: Prisma.InputJsonObject }> {
    const [activeSensors, openAlerts, activePredictions] = await Promise.all([
      this.prisma.sensor.count({
        where: { site: { tenantId }, status: { not: 'OFFLINE' } },
      }),
      this.prisma.alert.count({ where: { tenantId, status: 'OPEN' } }),
      this.prisma.prediction.count({ where: { tenantId, status: 'ACTIVE' } }),
    ]);

    return {
      text: `نظرة عامة: ${activeSensors} جهاز استشعار نشط، ${openAlerts} تنبيه مفتوح، ${activePredictions} تنبؤ نشط. اسأليني عن الكهرباء أو الطقس أو التنبيهات أو المستشعرات لتفاصيل أدق.`,
      refs: { intent: 'GENERAL', activeSensors, openAlerts, activePredictions },
    };
  }

  async sendMessage(
    tenantId: string,
    userId: string,
    conversationId: string,
    content: string,
  ) {
    const conversation = await this.prisma.chatConversation.findFirst({
      where: { id: conversationId, tenantId, userId },
    });
    if (!conversation) throw new NotFoundException('المحادثة غير موجودة');

    await this.prisma.chatMessage.create({
      data: { conversationId, role: 'USER', content },
    });

    const intent = detectIntent(content);
    const builders: Record<
      Intent,
      () => Promise<{ text: string; refs: Prisma.InputJsonObject }>
    > = {
      POWER: () => this.buildPowerAnswer(tenantId),
      PREDICTIONS: () => this.buildPredictionsAnswer(tenantId),
      ALERTS: () => this.buildAlertsAnswer(tenantId),
      WEATHER: () => this.buildWeatherAnswer(tenantId),
      IOT: () => this.buildIotAnswer(tenantId),
      GENERAL: () => this.buildGeneralAnswer(tenantId),
    };

    const { text, refs } = await builders[intent]();

    const rephrased = this.llm.isConfigured
      ? await this.llm.rephrase(content, `${text}\n\n(بيانات مرجعية: ${JSON.stringify(refs)})`)
      : null;

    return this.prisma.chatMessage.create({
      data: {
        conversationId,
        role: 'ASSISTANT',
        content: rephrased ?? text,
        contextRefs: refs,
      },
    });
  }

  async getCompositeAlerts(tenantId: string) {
    const sites = await this.prisma.site.findMany({
      where: { tenantId },
      include: {
        powerReadings: { orderBy: { recordedAt: 'desc' }, take: 1 },
        weatherReadings: { orderBy: { recordedAt: 'desc' }, take: 1 },
        alerts: { where: { status: 'OPEN', severity: 'CRITICAL' } },
        riskFactors: { orderBy: { recordedAt: 'desc' }, take: 5 },
      },
    });

    const composites: {
      id: string;
      siteName: string;
      factors: string[];
      recommendation: string;
      actionType: 'ENABLE_NIGHT_RATIONING' | 'TURN_OFF_AC' | null;
    }[] = [];

    for (const site of sites) {
      const power = site.powerReadings[0];
      const weather = site.weatherReadings[0];

      if (power && weather) {
        const loadPct = (power.currentLoadKw / power.maxCapacityKw) * 100;
        if (loadPct >= 75 && weather.temperatureC >= 35) {
          composites.push({
            id: `${site.id}-power-heat`,
            siteName: site.name,
            factors: [
              `حمل كهربائي مرتفع (${loadPct.toFixed(0)}%)`,
              `حرارة مرتفعة (${weather.temperatureC.toFixed(1)}°)`,
            ],
            recommendation:
              'الجمع بين الحمل الكهربائي المرتفع والحرارة يزيد خطر الفشل الحراري — يُنصح بتفعيل الترشيد الليلي فورًا لتخفيف الضغط.',
            actionType: 'ENABLE_NIGHT_RATIONING',
          });
        }
      }

      const avgRisk = site.riskFactors.length
        ? site.riskFactors.reduce((sum, r) => sum + r.score, 0) /
          site.riskFactors.length
        : 0;
      if (site.alerts.length > 0 && avgRisk >= 50) {
        composites.push({
          id: `${site.id}-alert-risk`,
          siteName: site.name,
          factors: [
            `${site.alerts.length} تنبيه حرج مفتوح`,
            `متوسط درجة مخاطر ${avgRisk.toFixed(0)}%`,
          ],
          recommendation:
            'تزامن تنبيه حرج مع درجة مخاطر مرتفعة يستدعي مراجعة فورية من مهندس الدعم الفني لهذا الموقع.',
          actionType: null,
        });
      }
    }

    return composites;
  }
}
