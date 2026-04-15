-- Fix grants for multi-schema access used by logistics APIs
-- Run this in Supabase SQL Editor (project: mhfdzprxauqfczmtyizg)

begin;

-- NOTE:
-- Do not CREATE/REPLACE helper functions here because some environments
-- may already have different function signatures.
-- We only grant EXECUTE on all existing functions in schema core below.

-- Ensure API roles can access these schemas
GRANT USAGE ON SCHEMA core TO authenticated, anon, service_role;
GRANT USAGE ON SCHEMA logistics TO authenticated, anon, service_role;
GRANT USAGE ON SCHEMA sales TO authenticated, anon, service_role;

-- Core reference tables used by enrichment
GRANT SELECT ON TABLE core.m_varian TO authenticated, service_role;
GRANT SELECT ON TABLE core.m_produk TO authenticated, service_role;

-- Logistics tables used by logistics endpoints
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE logistics.t_logistik_manifest TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE logistics.t_packing TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE logistics.t_return_order TO authenticated, service_role;

-- Sales reference table used by enrichment
GRANT SELECT ON TABLE sales.t_sales_order TO authenticated, service_role;

-- Helper functions used inside RLS predicates
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA core TO authenticated, service_role;

-- Optional: keep future tables in these schemas accessible to API roles
ALTER DEFAULT PRIVILEGES IN SCHEMA core GRANT SELECT ON TABLES TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA logistics GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA sales GRANT SELECT ON TABLES TO authenticated, service_role;

commit;
