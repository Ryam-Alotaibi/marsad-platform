-- Row-Level Security: DB-level tenant isolation as a defense-in-depth layer
-- underneath the existing application-level `WHERE tenantId = ...` filtering.
--
-- Enabled only on tables that (a) carry a direct, always-populated "tenantId"
-- column and (b) are never legitimately read/written across tenants within a
-- single request. Deliberately EXCLUDED:
--   - User, Role, Tenant: queried pre-authentication (login by email) or are
--     the root/global tables themselves.
--   - FLParticipation, FLTenantUpdate, FLModel, FLRound: the federated-learning
--     coordinator intentionally reads/writes these across ALL participating
--     tenants within one aggregation request (that's the point of federation).
--
-- The policy compares "tenantId" to the Postgres session variable
-- app.current_tenant_id, which the NestJS API sets per-request (see
-- apps/api/src/prisma/tenant-context.ts). FORCE ROW LEVEL SECURITY means even
-- the owning role is restricted — the only way around it is connecting as a
-- role with the BYPASSRLS attribute (used solely for migrations/seeding, see
-- MIGRATOR_DATABASE_URL).

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'alerts',
    'chat_conversations',
    'device_categories',
    'escalation_rules',
    'notification_channels',
    'playbooks',
    'predictions',
    'rationing_schedules',
    'risk_factors',
    'scenario_runs',
    'scheduled_services',
    'sites',
    'system_components',
    'telecom_providers',
    'audit_logs',
    'regions'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I USING ("tenantId" = current_setting(''app.current_tenant_id'', true)) WITH CHECK ("tenantId" = current_setting(''app.current_tenant_id'', true))',
      t
    );
  END LOOP;
END $$;
