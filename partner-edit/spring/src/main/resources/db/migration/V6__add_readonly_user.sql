-- V6: Create read-only DB user for partner-search backends.
-- partner_search_ro can SELECT from all tables but cannot INSERT/UPDATE/DELETE.

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'partner_search_ro') THEN
    CREATE ROLE partner_search_ro WITH LOGIN PASSWORD 'partner_search_ro';
  END IF;
END $$;

GRANT CONNECT ON DATABASE "app-partner-edit-db" TO partner_search_ro;
GRANT USAGE ON SCHEMA public TO partner_search_ro;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO partner_search_ro;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO partner_search_ro;
