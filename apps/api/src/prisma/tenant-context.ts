import { AsyncLocalStorage } from 'node:async_hooks';
import type { Prisma } from '@prisma/client';

/**
 * Holds the current request's tenant-scoped Prisma transaction client.
 * Set by TenantContextInterceptor, read by PrismaService's proxy so every
 * existing `this.prisma.xxx` call site is transparently tenant-scoped
 * without being rewritten.
 */
export const tenantStorage = new AsyncLocalStorage<Prisma.TransactionClient>();
