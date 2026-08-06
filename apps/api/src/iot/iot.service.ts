import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { SensorType } from '@prisma/client';

type Status = 'NORMAL' | 'WARNING' | 'CRITICAL';

function classify(type: SensorType, value: number): Status {
  switch (type) {
    case 'TEMPERATURE':
      if (value >= 40) return 'CRITICAL';
      if (value >= 35) return 'WARNING';
      return 'NORMAL';
    case 'HUMIDITY':
      if (value >= 85 || value <= 15) return 'CRITICAL';
      if (value >= 70 || value <= 25) return 'WARNING';
      return 'NORMAL';
    case 'AQI':
      if (value >= 150) return 'CRITICAL';
      if (value >= 100) return 'WARNING';
      return 'NORMAL';
    case 'CO2':
      if (value >= 1500) return 'CRITICAL';
      if (value >= 1000) return 'WARNING';
      return 'NORMAL';
    case 'WATER_LEAK':
      return value > 0 ? 'CRITICAL' : 'NORMAL';
    case 'LIGHT':
    default:
      return 'NORMAL';
  }
}

function worstStatus(statuses: Status[]): Status {
  if (statuses.includes('CRITICAL')) return 'CRITICAL';
  if (statuses.includes('WARNING')) return 'WARNING';
  return 'NORMAL';
}

@Injectable()
export class IotService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(tenantId: string) {
    const sites = await this.prisma.site.findMany({
      where: { tenantId },
      include: {
        sensors: {
          include: { readings: { orderBy: { recordedAt: 'desc' }, take: 1 } },
        },
        _count: { select: { alerts: { where: { status: 'OPEN' } } } },
      },
    });

    const siteSummaries = sites.map((site) => {
      const readings: Record<
        string,
        { value: number; unit: string; status: Status }
      > = {};
      const statuses: Status[] = [];

      for (const sensor of site.sensors) {
        const latest = sensor.readings[0];
        if (!latest) continue;
        const status = classify(sensor.type, latest.value);
        readings[sensor.type] = {
          value: latest.value,
          unit: sensor.unit,
          status,
        };
        statuses.push(status);
      }

      return {
        id: site.id,
        name: site.name,
        latitude: site.latitude,
        longitude: site.longitude,
        status: worstStatus(statuses),
        readings,
        activeAlertsCount: site._count.alerts,
      };
    });

    const summary = {
      critical: siteSummaries.filter((s) => s.status === 'CRITICAL').length,
      warning: siteSummaries.filter((s) => s.status === 'WARNING').length,
      normal: siteSummaries.filter((s) => s.status === 'NORMAL').length,
    };

    return { summary, sites: siteSummaries };
  }
}
