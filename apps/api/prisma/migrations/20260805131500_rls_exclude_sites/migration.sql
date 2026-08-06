-- Exclude `sites` from Row-Level Security.
--
-- Discovered while verifying the previous migration: the federated-learning
-- coordinator (POST /federated/rounds/run) gathers PowerReading/WeatherReading
-- samples for every PARTICIPATING tenant within one request, filtering via
-- `site: { tenantId }` relation queries. Because that relation filter is a
-- join against `sites`, RLS on `sites` silently hid every tenant's sites
-- except the requesting admin's own — collapsing a multi-tenant federated
-- round down to a single tenant with zero explicit error (verified via a
-- real 3-tenant round: only 1 of 3 joined tenants ended up in
-- participatingTenants before this fix).
--
-- Site data (name, type, coordinates, region) is structural/organizational
-- rather than sensitive operational data, so leaving it app-layer-filtered
-- (as it already was pre-RLS, and still is via every module's explicit
-- `where: { tenantId }`) is an acceptable, documented scope decision —
-- unlike Alert/Prediction/ScheduledService/etc., which stay RLS-protected.

ALTER TABLE sites NO FORCE ROW LEVEL SECURITY;
ALTER TABLE sites DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON sites;
