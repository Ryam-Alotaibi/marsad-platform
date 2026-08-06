import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RiskService {
  constructor(private readonly prisma: PrismaService) {}

  async findAlerts(tenantId: string) {
    const alerts = await this.prisma.alert.findMany({
      where: { tenantId },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      include: { site: { select: { name: true } } },
    });

    return alerts.map((a) => ({
      id: a.id,
      category: a.category,
      severity: a.severity,
      title: a.title,
      description: a.description,
      status: a.status,
      siteName: a.site?.name ?? null,
      createdAt: a.createdAt,
      resolvedAt: a.resolvedAt,
    }));
  }

  async getRiskFactorBreakdown(tenantId: string) {
    const aggregates = await this.prisma.riskFactor.groupBy({
      by: ['factorType'],
      where: { tenantId },
      _avg: { score: true, weight: true },
      _count: { _all: true },
    });

    return aggregates
      .map((row) => ({
        factorType: row.factorType,
        averageScore: Math.round((row._avg.score ?? 0) * 10) / 10,
        weight: row._avg.weight ?? 0,
        sampleCount: row._count._all,
      }))
      .sort((a, b) => b.averageScore - a.averageScore);
  }
}
