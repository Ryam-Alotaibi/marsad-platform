import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PredictionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findActive(tenantId: string) {
    const predictions = await this.prisma.prediction.findMany({
      where: { tenantId, status: 'ACTIVE' },
      orderBy: { confidencePct: 'desc' },
      include: {
        site: { select: { name: true } },
        actions: {
          orderBy: { createdAt: 'asc' },
          include: { assignedUser: { select: { fullName: true } } },
        },
      },
    });

    return predictions.map((p) => ({
      id: p.id,
      title: p.title,
      confidencePct: p.confidencePct,
      rootCause: p.rootCause,
      windowStart: p.windowStart,
      windowEnd: p.windowEnd,
      siteName: p.site?.name ?? null,
      actions: p.actions.map((a) => ({
        id: a.id,
        description: a.description,
        status: a.status,
        assignedRoleKey: a.assignedRoleKey,
        assignedUserName: a.assignedUser?.fullName ?? null,
      })),
    }));
  }
}
