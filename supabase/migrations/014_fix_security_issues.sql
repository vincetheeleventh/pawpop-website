-- Migration: 014_fix_security_issues
-- Description: Fix Supabase security linter issues
-- Created: 2024-12-24
-- Issues Fixed:
--   1. Security Definer View: monitoring_dashboard
--   2. RLS Disabled: users table
--   3. RLS Disabled: schema_version table

BEGIN;

-- 1. Fix monitoring_dashboard view security definer issue
-- Drop the existing view and recreate without SECURITY DEFINER
DROP VIEW IF EXISTS monitoring_dashboard;

-- Recreate the view without SECURITY DEFINER (defaults to SECURITY INVOKER)
CREATE VIEW monitoring_dashboard AS
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

-- Add comment for documentation
COMMENT ON VIEW monitoring_dashboard IS 'Dashboard view for monitoring system health (SECURITY INVOKER)';

-- 2. Enable RLS on users table and create appropriate policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own record
CREATE POLICY "Users can view own record" ON users
    FOR SELECT USING (auth.uid() = id);

-- Policy: Users can update their own record
CREATE POLICY "Users can update own record" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Policy: Service role has full access to users
CREATE POLICY "Service role full access to users" ON users
    FOR ALL TO service_role USING (true);

-- Policy: Allow user registration (INSERT for authenticated users)
CREATE POLICY "Allow user registration" ON users
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- 3. Enable RLS on schema_version table and create appropriate policies
ALTER TABLE schema_version ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role can access schema_version table
-- This table contains sensitive migration information and should only be accessible to service role
CREATE POLICY "Service role only access to schema_version" ON schema_version
    FOR ALL TO service_role USING (true);

-- Policy: Deny all access to non-service roles
CREATE POLICY "Deny public access to schema_version" ON schema_version
    FOR ALL TO anon, authenticated USING (false);

-- Grant necessary permissions to service role for the monitoring view
GRANT SELECT ON monitoring_dashboard TO service_role;

-- Add comments for documentation
COMMENT ON POLICY "Users can view own record" ON users IS 'Users can only view their own user record';
COMMENT ON POLICY "Users can update own record" ON users IS 'Users can only update their own user record';
COMMENT ON POLICY "Service role full access to users" ON users IS 'Service role has full CRUD access to users table';
COMMENT ON POLICY "Allow user registration" ON users IS 'Authenticated users can create their own user record';

COMMENT ON POLICY "Service role only access to schema_version" ON schema_version IS 'Only service role can access migration version information';
COMMENT ON POLICY "Deny public access to schema_version" ON schema_version IS 'Explicitly deny access to schema_version for public and authenticated users';

COMMIT;
