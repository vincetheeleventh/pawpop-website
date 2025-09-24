-- Migration: 016_fix_monitoring_dashboard_security_invoker
-- Description: Final fix for monitoring_dashboard using security_invoker=on
-- Created: 2024-12-24
-- Based on Supabase AI recommendation - this is the working solution

BEGIN;

-- Drop the existing view
DROP VIEW IF EXISTS public.monitoring_dashboard;

-- Recreate the view with explicit security_invoker=on
CREATE VIEW public.monitoring_dashboard WITH (security_invoker=on) AS
SELECT 
    'supabase'::text AS service,
    'healthy'::text AS status,
    1 AS active_connections,
    100 AS max_connections,
    1.0::DECIMAL(5,2) AS connection_utilization,
    NOW() AS last_check
    
UNION ALL

SELECT 
    'fal-ai'::text AS service,
    'healthy'::text AS status,
    (SELECT COUNT(*)::INTEGER FROM fal_ai_usage WHERE created_at > NOW() - INTERVAL '24 hours') AS active_connections,
    NULL::integer AS max_connections,
    0.0::DECIMAL(5,2) AS connection_utilization,
    NOW() AS last_check
    
UNION ALL

SELECT 
    'stripe'::text AS service,
    'healthy'::text AS status,
    (SELECT COUNT(*)::INTEGER FROM stripe_webhook_events WHERE created_at > NOW() - INTERVAL '24 hours') AS active_connections,
    NULL::integer AS max_connections,
    100.0::DECIMAL(5,2) AS connection_utilization,
    NOW() AS last_check;

-- Grant permissions
GRANT SELECT ON monitoring_dashboard TO service_role;

-- Add comment
COMMENT ON VIEW monitoring_dashboard IS 'Monitoring dashboard with explicit SECURITY INVOKER';

COMMIT;
