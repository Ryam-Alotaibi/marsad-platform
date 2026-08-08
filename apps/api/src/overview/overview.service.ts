import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function weatherRisk(tempC: number, aqi: number): number {
  let tempRisk: number;
  if (tempC < 25) tempRisk = 10;
  else if (tempC < 35) tempRisk = 35;
  else if (tempC < 40) tempRisk = 60;
  else if (tempC < 45) tempRisk = 80;
  else tempRisk = 95;
  return Math.round(tempRisk * 0.7 + Math.min(100, aqi) * 0.3);
}

@Injectable()
export class OverviewService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(tenantId: string) {
    const [
      activeSystemsCount,
      recentRiskFactors,
      latestWeather,
      telecomAgg,
      providers,
    ] = await Promise.all([
      this.prisma.sensor.count({
        where: { status: { not: 'OFFLINE' }, site: { tenantId } },
      }),
      this.prisma.riskFactor.findMany({
        where: { tenantId },
        orderBy: { recordedAt: 'desc' },
        take: 20,
        include: { site: { select: { name: true } } },
      }),
      this.prisma.weatherReading.findFirst({
        where: { site: { tenantId } },
        orderBy: { recordedAt: 'desc' },
        include: { site: { select: { name: true } } },
      }),
      this.prisma.telecomStatusReading.groupBy({
        by: ['providerId'],
        where: { site: { tenantId } },
        _avg: { latencyMs: true, packetLossPct: true },
      }),
      this.prisma.telecomProvider.findMany({ where: { tenantId } }),
    ]);

    const avgRiskScore = average(recentRiskFactors.map((r) => r.score));
    const systemHealthPct = Math.round(clamp(100 - avgRiskScore, 0, 100));

    const currentTempC = latestWeather?.temperatureC ?? null;
    const currentSiteName = latestWeather?.site.name ?? null;
    const weatherRiskPct = latestWeather
      ? weatherRisk(latestWeather.temperatureC, latestWeather.aqi)
      : 0;

    const byFactorType = new Map<string, number[]>();
    for (const rf of recentRiskFactors) {
      const arr = byFactorType.get(rf.factorType) ?? [];
      arr.push(rf.score);
      byFactorType.set(rf.factorType, arr);
    }
    const externalFactors = [
      ...(latestWeather
        ? [
            {
              factorType: 'WEATHER',
              impactPct: weatherRiskPct,
              reason: `درجة حرارة ${latestWeather.temperatureC.toFixed(1)}° ورطوبة ${latestWeather.humidityPct.toFixed(0)}% عند ${currentSiteName}`,
            },
          ]
        : []),
      ...Array.from(byFactorType.entries()).map(([factorType, scores]) => ({
        factorType,
        impactPct: Math.round(average(scores)),
        reason: null as string | null,
      })),
    ]
      .sort((a, b) => b.impactPct - a.impactPct)
      .slice(0, 4);

    const providerById = new Map(providers.map((p) => [p.id, p.name]));
    const telecomStatus = telecomAgg
      .map((row) => {
        const latencyMs = row._avg.latencyMs ?? 0;
        const packetLossPct = row._avg.packetLossPct ?? 0;
        const uptimePct = clamp(100 - packetLossPct * 10, 0, 100);
        const status =
          latencyMs < 60 ? 'ممتاز' : latencyMs < 120 ? 'مستقر' : 'بطيء';
        return {
          providerName: providerById.get(row.providerId) ?? 'غير معروف',
          status,
          latencyMs: Math.round(latencyMs),
          uptimePct: Math.round(uptimePct * 10) / 10,
        };
      })
      .sort((a, b) => a.latencyMs - b.latencyMs);

    return {
      activeSystemsCount,
      systemHealthPct,
      weatherRiskPct,
      currentTempC,
      currentSiteName,
      externalFactors,
      telecomStatus,
    };
  }
}
