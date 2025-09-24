-- Rollback Migration: 014_rollback_fix_security_issues
-- Description: Rollback security fixes if needed
-- Created: 2024-12-24
-- Rollbacks:
--   1. Restore monitoring_dashboard view with SECURITY DEFINER
--   2. Disable RLS on users table
--   3. Disable RLS on schema_version table

BEGIN;

-- 1. Rollback monitoring_dashboard view to SECURITY DEFINER
DROP VIEW IF EXISTS monitoring_dashboard;

-- Recreate the view with SECURITY DEFINER (original state)
CREATE OR REPLACE VIEW monitoring_dashboard 
SECURITY DEFINER AS
SELECT 
    'supabase'::text AS service,
    CASE 
        WHEN cs.connection_utilization > 90 THEN 'critical'::text
        WHEN cs.connection_utilization > 80 THEN 'warning'::text
        ELSE 'healthy'::text
    END AS status,
    cs.active_connections,
    cs.max_connections,
    cs.connection_utilization,
    NOW() AS last_check
FROM get_connection_stats() cs

UNION ALL

SELECT 
    'fal-ai'::text AS service,
    CASE 
        WHEN fu.error_rate > 20 THEN 'critical'::text
        WHEN fu.error_rate > 10 OR fu.total_cost > 50 THEN 'warning'::text
        ELSE 'healthy'::text
    END AS status,
    fu.total_requests AS active_connections,
    NULL::integer AS max_connections,
    fu.error_rate AS connection_utilization,
    NOW() AS last_check
FROM get_daily_fal_usage() fu

UNION ALL

SELECT 
    'stripe'::text AS service,
    CASE 
        WHEN swh.success_rate < 90 THEN 'critical'::text
        WHEN swh.success_rate < 95 THEN 'warning'::text
        ELSE 'healthy'::text
    END AS status,
    swh.total_webhooks AS active_connections,
    NULL::integer AS max_connections,
    swh.success_rate AS connection_utilization,
    NOW() AS last_check
FROM get_stripe_webhook_health() swh;

-- 2. Rollback users table RLS
-- Drop all RLS policies first
DROP POLICY IF EXISTS "Users can view own record" ON users;
DROP POLICY IF EXISTS "Users can update own record" ON users;
DROP POLICY IF EXISTS "Service role full access to users" ON users;
DROP POLICY IF EXISTS "Allow user registration" ON users;

-- Disable RLS on users table
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 3. Rollback schema_version table RLS
-- Drop all RLS policies first
DROP POLICY IF EXISTS "Service role only access to schema_version" ON schema_version;
DROP POLICY IF EXISTS "Deny public access to schema_version" ON schema_version;

-- Disable RLS on schema_version table
ALTER TABLE schema_version DISABLE ROW LEVEL SECURITY;

-- Restore original comment
COMMENT ON VIEW monitoring_dashboard IS 'Dashboard view for monitoring system health (SECURITY DEFINER)';

COMMIT;
