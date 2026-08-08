import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function heatRisk(tempC: number): number {
  if (tempC < 25) return 10;
  if (tempC < 35) return 35;
  if (tempC < 40) return 60;
  if (tempC < 45) return 80;
  return 95;
}

@Injectable()
export class EnvironmentService {
  constructor(private readonly prisma: PrismaService) {}

  async getEnvironment(tenantId: string) {
    const [telecomReadings, powerReadings, weatherReadings, sites] =
      await Promise.all([
        this.prisma.telecomStatusReading.findMany({
          where: { site: { tenantId } },
        }),
        this.prisma.powerReading.findMany({
          where: { site: { tenantId } },
        }),
        this.prisma.weatherReading.findMany({
          where: { site: { tenantId } },
        }),
        this.prisma.site.findMany({
          where: { tenantId },
          include: {
            weatherReadings: { orderBy: { recordedAt: 'desc' }, take: 1 },
            scheduledEvents: true,
          },
        }),
      ]);

    const avgPacketLoss = average(telecomReadings.map((r) => r.packetLossPct));
    const avgLatency = average(telecomReadings.map((r) => r.latencyMs));
    const telecomQualityRisk = Math.round(
      clamp(avgPacketLoss * 15 + avgLatency / 3, 0, 100),
    );

    const avgLoadPct = average(
      powerReadings.map((r) => (r.currentLoadKw / r.maxCapacityKw) * 100),
    );
    const powerStabilityRisk = Math.round(clamp(avgLoadPct, 0, 100));

    const avgTemp = average(weatherReadings.map((r) => r.temperatureC));
    const heatRiskPct = Math.round(heatRisk(avgTemp));

    const avgHumidity = average(weatherReadings.map((r) => r.humidityPct));
    const humidityRiskPct = Math.round(clamp(avgHumidity * 1.1, 0, 100));

    const factors = [
      {
        key: 'TELECOM_QUALITY',
        labelAr: 'جودة الاتصالات',
        riskPct: telecomQualityRisk,
      },
      {
        key: 'POWER_STABILITY',
        labelAr: 'استقرار الكهرباء',
        riskPct: powerStabilityRisk,
      },
      { key: 'HEAT', labelAr: 'الحرارة', riskPct: heatRiskPct },
      { key: 'HUMIDITY', labelAr: 'الرطوبة', riskPct: humidityRiskPct },
    ];

    const compositeIndex = Math.round(average(factors.map((f) => f.riskPct)));

    return {
      compositeIndex,
      factors,
      sites: sites.map((site) => ({
        id: site.id,
        name: site.name,
        aqi: site.weatherReadings[0]?.aqi ?? null,
        temperatureC: site.weatherReadings[0]?.temperatureC ?? null,
        scheduledEventsCount: site.scheduledEvents.length,
      })),
    };
  }
}
