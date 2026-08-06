import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { from, Observable } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from './prisma.service';
import { tenantStorage } from './tenant-context';
import type { RequestUser } from '../auth/current-user.decorator';

/**
 * Opens one Postgres transaction per authenticated request, sets the
 * transaction-scoped session variable app.current_tenant_id from the JWT's
 * tenantId, and threads that transaction client through AsyncLocalStorage so
 * PrismaService's proxy picks it up for every query made while handling this
 * request. This is what makes the Row-Level Security policies (see the
 * enable_row_level_security migration) actually take effect — without a
 * session variable set, RLS-protected tables return zero rows.
 *
 * Requests with no authenticated user (public routes like /auth/login) pass
 * through untouched and run against the raw client.
 */
@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<{ user?: RequestUser }>();
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return next.handle();
    }

    return from(
      this.prisma.client.$transaction(
        async (tx) => {
          await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`;
          return tenantStorage.run(tx, () => firstValueFrom(next.handle()));
        },
        { timeout: 30_000, maxWait: 10_000 },
      ),
    );
  }
}
