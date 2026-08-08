import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function weatherBand(tempC: number): string {
  if (tempC < 25) return 'GREEN';
  if (tempC < 35) return 'YELLOW';
  if (tempC < 40) return 'ORANGE';
  if (tempC < 45) return 'RED';
  return 'CRITICAL';
}

@Injectable()
export class MapsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPowerMap(tenantId: string) {
    const sites = await this.prisma.site.findMany({
      where: { tenantId },
      include: {
        powerReadings: { orderBy: { recordedAt: 'desc' }, take: 1 },
      },
    });

    return sites.map((site) => {
      const latest = site.powerReadings[0] ?? null;
      const loadPct = latest
        ? clamp((latest.currentLoadKw / latest.maxCapacityKw) * 100, 0, 999)
        : 0;
      return {
        id: site.id,
        name: site.name,
        latitude: site.latitude,
        longitude: site.longitude,
        currentLoadKw: latest?.currentLoadKw ?? null,
        maxCapacityKw: latest?.maxCapacityKw ?? null,
        loadPct: Math.round(loadPct * 10) / 10,
        generatorFuelPct: latest?.generatorFuelPct ?? null,
        upsChargePct: latest?.upsChargePct ?? null,
        voltage: latest?.voltage ?? null,
      };
    });
  }

  async getPowerCurve(tenantId: string, siteId: string) {
    const site = await this.prisma.site.findFirst({
      where: { id: siteId, tenantId },
    });
    if (!site) throw new NotFoundException('الموقع غير موجود');

    // Anchored to the latest seeded reading (not wall-clock "now") so the
    // 24h window stays meaningful regardless of how much real time has
    // passed since the demo data was seeded.
    const latest = await this.prisma.powerReading.findFirst({
      where: { siteId },
      orderBy: { recordedAt: 'desc' },
    });
    if (!latest) return [];
    const since = new Date(latest.recordedAt.getTime() - 24 * 60 * 60 * 1000);
    const readings = await this.prisma.powerReading.findMany({
      where: { siteId, recordedAt: { gte: since } },
      orderBy: { recordedAt: 'asc' },
    });

    return readings.map((r) => ({
      recordedAt: r.recordedAt,
      loadPct:
        Math.round(
          clamp((r.currentLoadKw / r.maxCapacityKw) * 100, 0, 999) * 10,
        ) / 10,
    }));
  }

  async getTelecomMap(tenantId: string) {
    const [sites, providers] = await Promise.all([
      this.prisma.site.findMany({ where: { tenantId } }),
      this.prisma.telecomProvider.findMany({ where: { tenantId } }),
    ]);

    const since = new Date(Date.now() - 6 * 60 * 60 * 1000);
    const readings = await this.prisma.telecomStatusReading.findMany({
      where: { site: { tenantId }, recordedAt: { gte: since } },
      orderBy: { recordedAt: 'desc' },
    });

    const latestBySitePair = new Map<string, (typeof readings)[number]>();
    for (const r of readings) {
      const key = `${r.siteId}:${r.providerId}`;
      if (!latestBySitePair.has(key)) latestBySitePair.set(key, r);
    }

    return sites.map((site) => {
      const providerRows = providers.map((provider) => {
        const reading = latestBySitePair.get(`${site.id}:${provider.id}`);
        return {
          providerId: provider.id,
          providerName: provider.name,
          latencyMs: reading?.latencyMs ?? null,
          packetLossPct: reading?.packetLossPct ?? null,
          status: reading?.status ?? 'غير متاح',
        };
      });

      const worstPacketLoss = Math.max(
        0,
        ...providerRows.map((p) => p.packetLossPct ?? 0),
      );
      const topologyStatus =
        worstPacketLoss > 3 ? 'RED' : worstPacketLoss > 1 ? 'ORANGE' : 'GREEN';

      return {
        id: site.id,
        name: site.name,
        latitude: site.latitude,
        longitude: site.longitude,
        topologyStatus,
        providers: providerRows,
      };
    });
  }

  async getRiskMap(tenantId: string) {
    const sites = await this.prisma.site.findMany({
      where: { tenantId },
      include: {
        riskFactors: { orderBy: { recordedAt: 'desc' }, take: 10 },
        weatherReadings: { orderBy: { recordedAt: 'desc' }, take: 1 },
        _count: { select: { alerts: true } },
      },
    });

    return sites.map((site) => {
      const avgRisk = site.riskFactors.length
        ? site.riskFactors.reduce((sum, r) => sum + r.score, 0) /
          site.riskFactors.length
        : 0;
      return {
        id: site.id,
        name: site.name,
        latitude: site.latitude,
        longitude: site.longitude,
        riskScorePct: Math.round(avgRisk),
        infrastructureAgeYears: site.infrastructureAgeYears,
        historicalIncidentCount: site._count.alerts,
        currentTempC: site.weatherReadings[0]?.temperatureC ?? null,
      };
    });
  }

  async getWeatherMap(tenantId: string) {
    const sites = await this.prisma.site.findMany({
      where: { tenantId },
      include: {
        weatherReadings: { orderBy: { recordedAt: 'desc' }, take: 1 },
      },
    });

    return sites.map((site) => {
      const latest = site.weatherReadings[0] ?? null;
      return {
        id: site.id,
        name: site.name,
        latitude: site.latitude,
        longitude: site.longitude,
        temperatureC: latest?.temperatureC ?? null,
        humidityPct: latest?.humidityPct ?? null,
        aqi: latest?.aqi ?? null,
        band: latest ? weatherBand(latest.temperatureC) : 'GREEN',
      };
    });
  }
}
