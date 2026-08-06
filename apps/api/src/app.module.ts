import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TenantsModule } from './tenants/tenants.module';
import { OverviewModule } from './overview/overview.module';
import { PredictionsModule } from './predictions/predictions.module';
import { RiskModule } from './risk/risk.module';
import { MapsModule } from './maps/maps.module';
import { EnvironmentModule } from './environment/environment.module';
import { EnergyModule } from './energy/energy.module';
import { SystemsModule } from './systems/systems.module';
import { SupportModule } from './support/support.module';
import { NotificationsModule } from './notifications/notifications.module';
import { IotModule } from './iot/iot.module';
import { AlertPreferencesModule } from './alert-preferences/alert-preferences.module';
import { ChatModule } from './chat/chat.module';
import { FederatedModule } from './federated/federated.module';
import { ScenariosModule } from './scenarios/scenarios.module';
import { ContinuityModule } from './continuity/continuity.module';
import { AuditLogModule } from './audit-log/audit-log.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,
        limit: 120,
      },
    ]),
    PrismaModule,
    AuthModule,
    TenantsModule,
    OverviewModule,
    PredictionsModule,
    RiskModule,
    MapsModule,
    EnvironmentModule,
    EnergyModule,
    SystemsModule,
    SupportModule,
    NotificationsModule,
    IotModule,
    AlertPreferencesModule,
    ChatModule,
    FederatedModule,
    ScenariosModule,
    ContinuityModule,
    AuditLogModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
