-- CreateEnum
CREATE TYPE "TenantType" AS ENUM ('GOVERNMENT', 'HEALTHCARE', 'PRIVATE', 'NONPROFIT');

-- CreateEnum
CREATE TYPE "SiteType" AS ENUM ('MAIN_BUILDING', 'BRANCH');

-- CreateEnum
CREATE TYPE "RoleKey" AS ENUM ('SUPER_ADMIN', 'TENANT_ADMIN', 'REGION_MANAGER', 'SUPPORT_ENGINEER', 'OPERATIONS_CENTER', 'SITE_MANAGER', 'EMPLOYEE');

-- CreateEnum
CREATE TYPE "AvailabilityStatus" AS ENUM ('AVAILABLE', 'BUSY', 'UNAVAILABLE');

-- CreateEnum
CREATE TYPE "SensorType" AS ENUM ('TEMPERATURE', 'HUMIDITY', 'AQI', 'CO2', 'WATER_LEAK', 'LIGHT');

-- CreateEnum
CREATE TYPE "SensorStatus" AS ENUM ('NORMAL', 'WARNING', 'CRITICAL', 'OFFLINE');

-- CreateEnum
CREATE TYPE "PredictionStatus" AS ENUM ('ACTIVE', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "ActionStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'DONE');

-- CreateEnum
CREATE TYPE "RiskFactorType" AS ENUM ('HUMAN_AWARENESS', 'LEGAL_COMPLIANCE', 'CYBER_COMPLIANCE', 'ENVIRONMENTAL', 'INFRASTRUCTURE_AGE');

-- CreateEnum
CREATE TYPE "AlertCategory" AS ENUM ('POWER', 'NETWORK', 'APPS', 'ENVIRONMENT', 'DATABASE', 'SECURITY', 'INFRASTRUCTURE');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('CRITICAL', 'WARNING', 'INFO');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "NotificationChannelType" AS ENUM ('PUSH', 'EMAIL', 'SMS', 'WHATSAPP', 'VOICE_CALL');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('QUEUED', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "DeviceCategoryType" AS ENUM ('AC', 'LIGHTING', 'COMPUTERS', 'PRINTERS', 'MONITORS');

-- CreateEnum
CREATE TYPE "ChatRole" AS ENUM ('USER', 'ASSISTANT');

-- CreateEnum
CREATE TYPE "ScenarioTrigger" AS ENUM ('MANUAL', 'NIGHTLY_SWEEPER');

-- CreateEnum
CREATE TYPE "ScenarioStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ScheduledServiceType" AS ENUM ('HEARING', 'APPOINTMENT', 'TRANSACTION');

-- CreateEnum
CREATE TYPE "ContinuitySourceType" AS ENUM ('PREDICTION', 'SCENARIO');

-- CreateEnum
CREATE TYPE "ContinuityActionType" AS ENUM ('REMOTE', 'RE_ROUTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "type" "TenantType" NOT NULL,
    "logoUrl" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#2563EB',
    "secondaryColor" TEXT NOT NULL DEFAULT '#0F172A',
    "locale" TEXT NOT NULL DEFAULT 'ar',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'branch',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "regions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sites" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "SiteType" NOT NULL DEFAULT 'BRANCH',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "key" "RoleKey" NOT NULL,
    "name" TEXT NOT NULL,
    "permissions" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "regionId" TEXT,
    "siteId" TEXT,
    "roleId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "phone" TEXT,
    "availabilityStatus" "AvailabilityStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sensors" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "type" "SensorType" NOT NULL,
    "unit" TEXT NOT NULL,
    "status" "SensorStatus" NOT NULL DEFAULT 'NORMAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sensors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sensor_readings" (
    "id" TEXT NOT NULL,
    "sensorId" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sensor_readings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "power_readings" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "currentLoadKw" DOUBLE PRECISION NOT NULL,
    "maxCapacityKw" DOUBLE PRECISION NOT NULL,
    "generatorFuelPct" DOUBLE PRECISION NOT NULL,
    "upsChargePct" DOUBLE PRECISION NOT NULL,
    "voltage" DOUBLE PRECISION NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "power_readings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "telecom_providers" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "telecom_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "telecom_status_readings" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "latencyMs" DOUBLE PRECISION NOT NULL,
    "packetLossPct" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "telecom_status_readings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weather_readings" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "temperatureC" DOUBLE PRECISION NOT NULL,
    "humidityPct" DOUBLE PRECISION NOT NULL,
    "aqi" DOUBLE PRECISION NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weather_readings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduled_events" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "expectedLoadImpactPct" DOUBLE PRECISION NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduled_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "predictions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "siteId" TEXT,
    "title" TEXT NOT NULL,
    "confidencePct" DOUBLE PRECISION NOT NULL,
    "rootCause" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "windowEnd" TIMESTAMP(3) NOT NULL,
    "status" "PredictionStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prediction_actions" (
    "id" TEXT NOT NULL,
    "predictionId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "assignedUserId" TEXT,
    "assignedRoleKey" "RoleKey",
    "status" "ActionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prediction_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_factors" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "factorType" "RiskFactorType" NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "risk_factors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "siteId" TEXT,
    "category" "AlertCategory" NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "AlertStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escalation_rules" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "delayMinutes" INTEGER NOT NULL,
    "notifyRoles" JSONB NOT NULL,

    CONSTRAINT "escalation_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escalation_logs" (
    "id" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notifiedUserIds" JSONB NOT NULL,

    CONSTRAINT "escalation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_channels" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" "NotificationChannelType" NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "notification_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_logs" (
    "id" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "channel" "NotificationChannelType" NOT NULL,
    "recipientId" TEXT NOT NULL,
    "renderedContent" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'QUEUED',
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channels" JSONB NOT NULL DEFAULT '[]',
    "thresholds" JSONB NOT NULL DEFAULT '{}',
    "watchedRegionIds" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "alert_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_categories" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "category" "DeviceCategoryType" NOT NULL,
    "activeCount" INTEGER NOT NULL,
    "offCount" INTEGER NOT NULL,
    "scheduledCount" INTEGER NOT NULL,
    "consumptionKw" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "device_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rationing_schedules" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "timeOfDay" TEXT NOT NULL,
    "actionDescription" TEXT NOT NULL,
    "expectedSavingsPct" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "rationing_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "energy_consumption_logs" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consumptionKw" DOUBLE PRECISION NOT NULL,
    "savingsKw" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "energy_consumption_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_conversations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" "ChatRole" NOT NULL,
    "content" TEXT NOT NULL,
    "contextRefs" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fl_models" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "taskType" TEXT NOT NULL,
    "globalWeightsRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fl_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fl_rounds" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "aggregateAccuracy" DOUBLE PRECISION,

    CONSTRAINT "fl_rounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fl_tenant_updates" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "accuracyBefore" DOUBLE PRECISION,
    "accuracyAfter" DOUBLE PRECISION,
    "weightsHash" TEXT NOT NULL,
    "auditHashPrev" TEXT,
    "auditHashSelf" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fl_tenant_updates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fl_participation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "fl_participation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scenario_runs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "triggeredBy" "ScenarioTrigger" NOT NULL,
    "inputFactors" JSONB NOT NULL,
    "isNovel" BOOLEAN NOT NULL DEFAULT false,
    "impactScore" DOUBLE PRECISION,
    "rootCauseExplanation" TEXT,
    "status" "ScenarioStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scenario_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scenario_impacts" (
    "id" TEXT NOT NULL,
    "scenarioRunId" TEXT NOT NULL,
    "affectedSiteId" TEXT NOT NULL,
    "affectedService" TEXT NOT NULL,
    "estimatedCost" DOUBLE PRECISION,
    "cascadeStep" INTEGER NOT NULL,

    CONSTRAINT "scenario_impacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "playbooks" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "scenarioRunId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isFrozen" BOOLEAN NOT NULL DEFAULT false,
    "activatedAt" TIMESTAMP(3),

    CONSTRAINT "playbooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduled_services" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "type" "ScheduledServiceType" NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "beneficiaryContact" TEXT NOT NULL,

    CONSTRAINT "scheduled_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "continuity_actions" (
    "id" TEXT NOT NULL,
    "sourceType" "ContinuitySourceType" NOT NULL,
    "predictionId" TEXT,
    "scenarioRunId" TEXT,
    "scheduledServiceId" TEXT NOT NULL,
    "actionTaken" "ContinuityActionType" NOT NULL,
    "notifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "continuity_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "regions_tenantId_idx" ON "regions"("tenantId");

-- CreateIndex
CREATE INDEX "sites_tenantId_idx" ON "sites"("tenantId");

-- CreateIndex
CREATE INDEX "sites_regionId_idx" ON "sites"("regionId");

-- CreateIndex
CREATE UNIQUE INDEX "roles_tenantId_key_key" ON "roles"("tenantId", "key");

-- CreateIndex
CREATE INDEX "users_tenantId_idx" ON "users"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "users_tenantId_email_key" ON "users"("tenantId", "email");

-- CreateIndex
CREATE INDEX "sensors_siteId_idx" ON "sensors"("siteId");

-- CreateIndex
CREATE INDEX "sensor_readings_sensorId_recordedAt_idx" ON "sensor_readings"("sensorId", "recordedAt");

-- CreateIndex
CREATE INDEX "power_readings_siteId_recordedAt_idx" ON "power_readings"("siteId", "recordedAt");

-- CreateIndex
CREATE INDEX "telecom_providers_tenantId_idx" ON "telecom_providers"("tenantId");

-- CreateIndex
CREATE INDEX "telecom_status_readings_siteId_recordedAt_idx" ON "telecom_status_readings"("siteId", "recordedAt");

-- CreateIndex
CREATE INDEX "telecom_status_readings_providerId_recordedAt_idx" ON "telecom_status_readings"("providerId", "recordedAt");

-- CreateIndex
CREATE INDEX "weather_readings_siteId_recordedAt_idx" ON "weather_readings"("siteId", "recordedAt");

-- CreateIndex
CREATE INDEX "scheduled_events_siteId_idx" ON "scheduled_events"("siteId");

-- CreateIndex
CREATE INDEX "predictions_tenantId_idx" ON "predictions"("tenantId");

-- CreateIndex
CREATE INDEX "prediction_actions_predictionId_idx" ON "prediction_actions"("predictionId");

-- CreateIndex
CREATE INDEX "risk_factors_tenantId_idx" ON "risk_factors"("tenantId");

-- CreateIndex
CREATE INDEX "risk_factors_siteId_recordedAt_idx" ON "risk_factors"("siteId", "recordedAt");

-- CreateIndex
CREATE INDEX "alerts_tenantId_idx" ON "alerts"("tenantId");

-- CreateIndex
CREATE INDEX "alerts_siteId_idx" ON "alerts"("siteId");

-- CreateIndex
CREATE INDEX "escalation_rules_tenantId_idx" ON "escalation_rules"("tenantId");

-- CreateIndex
CREATE INDEX "escalation_logs_alertId_idx" ON "escalation_logs"("alertId");

-- CreateIndex
CREATE INDEX "notification_channels_tenantId_idx" ON "notification_channels"("tenantId");

-- CreateIndex
CREATE INDEX "notification_logs_alertId_idx" ON "notification_logs"("alertId");

-- CreateIndex
CREATE UNIQUE INDEX "alert_preferences_userId_key" ON "alert_preferences"("userId");

-- CreateIndex
CREATE INDEX "device_categories_tenantId_idx" ON "device_categories"("tenantId");

-- CreateIndex
CREATE INDEX "device_categories_siteId_idx" ON "device_categories"("siteId");

-- CreateIndex
CREATE INDEX "rationing_schedules_tenantId_idx" ON "rationing_schedules"("tenantId");

-- CreateIndex
CREATE INDEX "energy_consumption_logs_siteId_recordedAt_idx" ON "energy_consumption_logs"("siteId", "recordedAt");

-- CreateIndex
CREATE INDEX "chat_conversations_tenantId_idx" ON "chat_conversations"("tenantId");

-- CreateIndex
CREATE INDEX "chat_conversations_userId_idx" ON "chat_conversations"("userId");

-- CreateIndex
CREATE INDEX "chat_messages_conversationId_idx" ON "chat_messages"("conversationId");

-- CreateIndex
CREATE INDEX "fl_rounds_modelId_idx" ON "fl_rounds"("modelId");

-- CreateIndex
CREATE INDEX "fl_tenant_updates_roundId_idx" ON "fl_tenant_updates"("roundId");

-- CreateIndex
CREATE INDEX "fl_tenant_updates_tenantId_idx" ON "fl_tenant_updates"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "fl_participation_tenantId_key" ON "fl_participation"("tenantId");

-- CreateIndex
CREATE INDEX "scenario_runs_tenantId_idx" ON "scenario_runs"("tenantId");

-- CreateIndex
CREATE INDEX "scenario_impacts_scenarioRunId_idx" ON "scenario_impacts"("scenarioRunId");

-- CreateIndex
CREATE INDEX "playbooks_tenantId_idx" ON "playbooks"("tenantId");

-- CreateIndex
CREATE INDEX "scheduled_services_tenantId_idx" ON "scheduled_services"("tenantId");

-- CreateIndex
CREATE INDEX "scheduled_services_siteId_scheduledAt_idx" ON "scheduled_services"("siteId", "scheduledAt");

-- CreateIndex
CREATE INDEX "continuity_actions_scheduledServiceId_idx" ON "continuity_actions"("scheduledServiceId");

-- CreateIndex
CREATE INDEX "audit_logs_tenantId_createdAt_idx" ON "audit_logs"("tenantId", "createdAt");

-- AddForeignKey
ALTER TABLE "regions" ADD CONSTRAINT "regions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sites" ADD CONSTRAINT "sites_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sites" ADD CONSTRAINT "sites_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "regions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "regions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sensors" ADD CONSTRAINT "sensors_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sensor_readings" ADD CONSTRAINT "sensor_readings_sensorId_fkey" FOREIGN KEY ("sensorId") REFERENCES "sensors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "power_readings" ADD CONSTRAINT "power_readings_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "telecom_providers" ADD CONSTRAINT "telecom_providers_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "telecom_status_readings" ADD CONSTRAINT "telecom_status_readings_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "telecom_status_readings" ADD CONSTRAINT "telecom_status_readings_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "telecom_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weather_readings" ADD CONSTRAINT "weather_readings_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_events" ADD CONSTRAINT "scheduled_events_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prediction_actions" ADD CONSTRAINT "prediction_actions_predictionId_fkey" FOREIGN KEY ("predictionId") REFERENCES "predictions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prediction_actions" ADD CONSTRAINT "prediction_actions_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_factors" ADD CONSTRAINT "risk_factors_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_factors" ADD CONSTRAINT "risk_factors_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escalation_rules" ADD CONSTRAINT "escalation_rules_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escalation_logs" ADD CONSTRAINT "escalation_logs_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "alerts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_channels" ADD CONSTRAINT "notification_channels_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "alerts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_preferences" ADD CONSTRAINT "alert_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_categories" ADD CONSTRAINT "device_categories_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_categories" ADD CONSTRAINT "device_categories_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rationing_schedules" ADD CONSTRAINT "rationing_schedules_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rationing_schedules" ADD CONSTRAINT "rationing_schedules_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "energy_consumption_logs" ADD CONSTRAINT "energy_consumption_logs_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "chat_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fl_rounds" ADD CONSTRAINT "fl_rounds_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "fl_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fl_tenant_updates" ADD CONSTRAINT "fl_tenant_updates_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "fl_rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fl_tenant_updates" ADD CONSTRAINT "fl_tenant_updates_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fl_participation" ADD CONSTRAINT "fl_participation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenario_runs" ADD CONSTRAINT "scenario_runs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenario_impacts" ADD CONSTRAINT "scenario_impacts_scenarioRunId_fkey" FOREIGN KEY ("scenarioRunId") REFERENCES "scenario_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenario_impacts" ADD CONSTRAINT "scenario_impacts_affectedSiteId_fkey" FOREIGN KEY ("affectedSiteId") REFERENCES "sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playbooks" ADD CONSTRAINT "playbooks_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playbooks" ADD CONSTRAINT "playbooks_scenarioRunId_fkey" FOREIGN KEY ("scenarioRunId") REFERENCES "scenario_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_services" ADD CONSTRAINT "scheduled_services_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_services" ADD CONSTRAINT "scheduled_services_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "continuity_actions" ADD CONSTRAINT "continuity_actions_predictionId_fkey" FOREIGN KEY ("predictionId") REFERENCES "predictions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "continuity_actions" ADD CONSTRAINT "continuity_actions_scenarioRunId_fkey" FOREIGN KEY ("scenarioRunId") REFERENCES "scenario_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "continuity_actions" ADD CONSTRAINT "continuity_actions_scheduledServiceId_fkey" FOREIGN KEY ("scheduledServiceId") REFERENCES "scheduled_services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
