import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { tenantStorage } from './tenant-context';

/**
 * Wraps (rather than extends) PrismaClient behind a Proxy so every existing
 * `this.prisma.alert.findMany(...)`-style call across the app transparently
 * resolves against the current request's tenant-scoped transaction client
 * (see tenant-context.ts / TenantContextInterceptor) when one is active, and
 * falls back to the raw client otherwise (pre-auth routes, or models
 * deliberately excluded from Row-Level Security).
 */
@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  readonly client = new PrismaClient();

  constructor() {
    return new Proxy(this, {
      get(target, prop, receiver) {
        if (Reflect.has(target, prop)) {
          return Reflect.get(target, prop, receiver);
        }
        const source: unknown = tenantStorage.getStore() ?? target.client;
        const value = (source as Record<PropertyKey, unknown>)[prop];
        return typeof value === 'function' ? value.bind(source) : value;
      },
    }) as this;
  }

  async onModuleInit() {
    await this.client.$connect();
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
  }
}

// Declaration merging: at compile time, every existing `this.prisma.alert`,
// `this.prisma.$transaction(...)` etc. call site across the app should keep
// type-checking exactly as it did when PrismaService extended PrismaClient
// directly — even though at runtime it's now a Proxy wrapping composition
// (see constructor above) so tenant-scoped queries can be transparently
// routed through Row-Level Security without rewriting any call site.
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export interface PrismaService extends PrismaClient {}
