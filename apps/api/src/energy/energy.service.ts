import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EnergyService {
  constructor(private readonly prisma: PrismaService) {}

  async getEnergy(tenantId: string) {
    const [deviceCategories, schedules, consumptionLogs] = await Promise.all([
      this.prisma.deviceCategory.findMany({
        where: { tenantId },
        include: { site: { select: { name: true } } },
      }),
      this.prisma.rationingSchedule.findMany({
        where: { tenantId },
        include: { site: { select: { name: true } } },
      }),
      this.prisma.energyConsumptionLog.findMany({
        where: { site: { tenantId } },
        orderBy: { recordedAt: 'desc' },
      }),
    ]);

    const totalConsumptionKw = consumptionLogs.reduce(
      (sum, l) => sum + l.consumptionKw,
      0,
    );
    const totalSavingsKw = consumptionLogs.reduce(
      (sum, l) => sum + l.savingsKw,
      0,
    );

    return {
      deviceCategories: deviceCategories.map((dc) => ({
        id: dc.id,
        siteName: dc.site.name,
        category: dc.category,
        activeCount: dc.activeCount,
        offCount: dc.offCount,
        scheduledCount: dc.scheduledCount,
        consumptionKw: dc.consumptionKw,
      })),
      schedules: schedules.map((s) => ({
        id: s.id,
        siteName: s.site.name,
        name: s.name,
        timeOfDay: s.timeOfDay,
        actionDescription: s.actionDescription,
        expectedSavingsPct: s.expectedSavingsPct,
        isActive: s.isActive,
      })),
      consumptionSummary: {
        totalConsumptionKw: Math.round(totalConsumptionKw * 10) / 10,
        totalSavingsKw: Math.round(totalSavingsKw * 10) / 10,
      },
    };
  }

  async turnOffAc(tenantId: string) {
    const acCategories = await this.prisma.deviceCategory.findMany({
      where: { tenantId, category: 'AC' },
    });

    await Promise.all(
      acCategories.map((dc) =>
        this.prisma.deviceCategory.update({
          where: { id: dc.id },
          data: { activeCount: 0, offCount: dc.offCount + dc.activeCount },
        }),
      ),
    );

    return this.getEnergy(tenantId);
  }

  async enableNightRationing(tenantId: string) {
    await this.prisma.rationingSchedule.updateMany({
      where: { tenantId },
      data: { isActive: true },
    });

    return this.getEnergy(tenantId);
  }

  async toggleSchedule(tenantId: string, scheduleId: string) {
    const schedule = await this.prisma.rationingSchedule.findFirstOrThrow({
      where: { id: scheduleId, tenantId },
    });

    await this.prisma.rationingSchedule.update({
      where: { id: schedule.id },
      data: { isActive: !schedule.isActive },
    });

    return this.getEnergy(tenantId);
  }
}
