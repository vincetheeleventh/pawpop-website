-- Rollback: Remove comprehensive monitoring and alerting system
-- Created: 2024-12-22
-- Description: Removes all monitoring tables, functions, and views

-- Drop the monitoring dashboard view
DROP VIEW IF EXISTS monitoring_dashboard;

-- Drop RLS policies
DROP POLICY IF EXISTS "Service role can manage monitoring alerts" ON monitoring_alerts;
DROP POLICY IF EXISTS "Service role can manage fal.ai usage" ON fal_ai_usage;
DROP POLICY IF EXISTS "Service role can manage stripe webhook events" ON stripe_webhook_events;
DROP POLICY IF EXISTS "Service role can manage system health metrics" ON system_health_metrics;

-- Drop functions
DROP FUNCTION IF EXISTS cleanup_monitoring_data();
DROP FUNCTION IF EXISTS get_stripe_webhook_health(INTEGER);
DROP FUNCTION IF EXISTS get_daily_fal_usage(DATE);
DROP FUNCTION IF EXISTS get_connection_stats();

-- Drop tables (in reverse order of dependencies)
DROP TABLE IF EXISTS system_health_metrics;
DROP TABLE IF EXISTS stripe_webhook_events;
DROP TABLE IF EXISTS fal_ai_usage;
DROP TABLE IF EXISTS monitoring_alerts;
