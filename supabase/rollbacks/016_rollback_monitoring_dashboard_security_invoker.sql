-- Rollback Migration: 016_rollback_monitoring_dashboard_security_invoker
-- Description: Rollback the monitoring dashboard security invoker fix
-- Created: 2024-12-24

BEGIN;

-- Drop the security invoker view
DROP VIEW IF EXISTS public.monitoring_dashboard;

-- Recreate the original view (this will have the SECURITY DEFINER issue again)
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

-- Grant permissions
GRANT SELECT ON monitoring_dashboard TO service_role;

-- Add comment
COMMENT ON VIEW monitoring_dashboard IS 'Original monitoring dashboard (will have SECURITY DEFINER warning)';

COMMIT;
