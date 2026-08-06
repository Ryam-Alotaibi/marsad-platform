import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AlertCategory } from '@prisma/client';
import type { UpdatePreferencesDto } from './dto/update-preferences.dto';

const DEFAULT_THRESHOLDS = {
  TEMPERATURE: 40,
  HUMIDITY: 70,
  AQI: 100,
  CO2: 1000,
};

@Injectable()
export class AlertPreferencesService {
  constructor(private readonly prisma: PrismaService) {}

  async getMine(userId: string) {
    const existing = await this.prisma.alertPreference.findUnique({
      where: { userId },
    });
    if (existing) return existing;

    return this.prisma.alertPreference.create({
      data: {
        userId,
        channels: ['PUSH', 'EMAIL'],
        thresholds: DEFAULT_THRESHOLDS,
        watchedRegionIds: [],
      },
    });
  }

  async updateMine(userId: string, dto: UpdatePreferencesDto) {
    await this.getMine(userId);
    return this.prisma.alertPreference.update({
      where: { userId },
      data: {
        channels: dto.channels,
        thresholds: dto.thresholds,
        watchedRegionIds: dto.watchedRegionIds,
      },
    });
  }

  findRegions(tenantId: string) {
    return this.prisma.region.findMany({
      where: { tenantId },
      select: { id: true, name: true },
    });
  }

  async getCategorySummary(tenantId: string) {
    const counts = await this.prisma.alert.groupBy({
      by: ['category'],
      where: { tenantId, status: 'OPEN' },
      _count: { _all: true },
    });
    const countByCategory = new Map(
      counts.map((c) => [c.category, c._count._all]),
    );

    return Object.values(AlertCategory).map((category) => ({
      category,
      openCount: countByCategory.get(category) ?? 0,
    }));
  }
}
