-- Runs once when the postgres container's data volume is first initialized
-- (official postgres image behavior for /docker-entrypoint-initdb.d). Creates
-- a second, non-superuser role for the running API server, separate from
-- POSTGRES_USER (which stays a superuser used only for migrations/seeding —
-- see MIGRATOR_DATABASE_URL). Without this split, POSTGRES_USER would be the
-- only role in the container and, being a superuser, would silently bypass
-- every Row-Level Security policy regardless of session context — the exact
-- gap this migration closes. See ARCHITECTURE.md "عزل الجهات على مستوى
-- قاعدة البيانات (RLS)".

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'marsad_app') THEN
    CREATE ROLE marsad_app LOGIN PASSWORD 'marsad_app_dev_password';
  END IF;
END
$$;

GRANT CONNECT ON DATABASE marsad TO marsad_app;
GRANT USAGE ON SCHEMA public TO marsad_app;

-- Tables/sequences don't exist yet at this point (this script runs before
-- `prisma migrate deploy`) — ALTER DEFAULT PRIVILEGES makes the grant apply
-- automatically to every table the migrator role (POSTGRES_USER, running the
-- migration) creates from here on.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO marsad_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO marsad_app;
