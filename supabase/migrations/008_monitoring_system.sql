-- Migration: Add comprehensive monitoring and alerting system
-- Created: 2024-12-22
-- Description: Creates tables and functions for monitoring Supabase, fal.ai, Stripe, and system health

-- Create monitoring alerts table
CREATE TABLE IF NOT EXISTS monitoring_alerts (
    id TEXT PRIMARY KEY,
    service TEXT NOT NULL CHECK (service IN ('supabase', 'fal-ai', 'stripe', 'printify', 'system')),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    message TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    resolved_by TEXT
);

-- Create indexes for monitoring alerts
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_service ON monitoring_alerts(service);
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_severity ON monitoring_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_resolved ON monitoring_alerts(resolved);
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_timestamp ON monitoring_alerts(timestamp DESC);

-- Create fal.ai usage tracking table
CREATE TABLE IF NOT EXISTS fal_ai_usage (
    id SERIAL PRIMARY KEY,
    endpoint TEXT NOT NULL,
    request_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('success', 'error')),
    response_time INTEGER NOT NULL, -- milliseconds
    cost DECIMAL(10,4) DEFAULT 0, -- USD cost
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for fal.ai usage
CREATE INDEX IF NOT EXISTS idx_fal_ai_usage_created_at ON fal_ai_usage(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fal_ai_usage_status ON fal_ai_usage(status);
CREATE INDEX IF NOT EXISTS idx_fal_ai_usage_endpoint ON fal_ai_usage(endpoint);

-- Create Stripe webhook events tracking table
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
    id SERIAL PRIMARY KEY,
    event_id TEXT NOT NULL UNIQUE,
    event_type TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
    processing_time INTEGER NOT NULL, -- milliseconds
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for Stripe webhook events
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_created_at ON stripe_webhook_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_status ON stripe_webhook_events(status);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_type ON stripe_webhook_events(event_type);

-- Create system health metrics table
CREATE TABLE IF NOT EXISTS system_health_metrics (
    id SERIAL PRIMARY KEY,
    service TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('healthy', 'warning', 'critical', 'down')),
    response_time INTEGER, -- milliseconds
    error_rate DECIMAL(5,2), -- percentage
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for system health metrics
CREATE INDEX IF NOT EXISTS idx_system_health_metrics_service ON system_health_metrics(service);
CREATE INDEX IF NOT EXISTS idx_system_health_metrics_created_at ON system_health_metrics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_health_metrics_status ON system_health_metrics(status);

-- Function to get Supabase connection statistics
CREATE OR REPLACE FUNCTION get_connection_stats()
RETURNS TABLE (
    active_connections INTEGER,
    max_connections INTEGER,
    active_queries INTEGER,
    connection_utilization DECIMAL(5,2)
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT count(*)::INTEGER FROM pg_stat_activity WHERE state = 'active') as active_connections,
        (SELECT setting::INTEGER FROM pg_settings WHERE name = 'max_connections') as max_connections,
        (SELECT count(*)::INTEGER FROM pg_stat_activity WHERE state = 'active' AND query != '<IDLE>') as active_queries,
        (SELECT ROUND(
            (count(*)::DECIMAL / (SELECT setting::INTEGER FROM pg_settings WHERE name = 'max_connections')) * 100, 
            2
        ) FROM pg_stat_activity WHERE state = 'active') as connection_utilization;
END;
$$;

-- Function to get daily fal.ai usage summary
CREATE OR REPLACE FUNCTION get_daily_fal_usage(target_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
    total_requests INTEGER,
    successful_requests INTEGER,
    failed_requests INTEGER,
    total_cost DECIMAL(10,4),
    avg_response_time DECIMAL(8,2),
    error_rate DECIMAL(5,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_requests,
        COUNT(*) FILTER (WHERE status = 'success')::INTEGER as successful_requests,
        COUNT(*) FILTER (WHERE status = 'error')::INTEGER as failed_requests,
        COALESCE(SUM(cost), 0) as total_cost,
        ROUND(AVG(response_time), 2) as avg_response_time,
        ROUND(
            (COUNT(*) FILTER (WHERE status = 'error')::DECIMAL / NULLIF(COUNT(*), 0)) * 100, 
            2
        ) as error_rate
    FROM fal_ai_usage
    WHERE DATE(created_at) = target_date;
END;
$$;

-- Function to get Stripe webhook health summary
CREATE OR REPLACE FUNCTION get_stripe_webhook_health(hours_back INTEGER DEFAULT 24)
RETURNS TABLE (
    total_webhooks INTEGER,
    successful_webhooks INTEGER,
    failed_webhooks INTEGER,
    success_rate DECIMAL(5,2),
    avg_processing_time DECIMAL(8,2),
    last_webhook_time TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_webhooks,
        COUNT(*) FILTER (WHERE status = 'success')::INTEGER as successful_webhooks,
        COUNT(*) FILTER (WHERE status = 'failed')::INTEGER as failed_webhooks,
        ROUND(
            (COUNT(*) FILTER (WHERE status = 'success')::DECIMAL / NULLIF(COUNT(*), 0)) * 100, 
            2
        ) as success_rate,
        ROUND(AVG(processing_time), 2) as avg_processing_time,
        MAX(created_at) as last_webhook_time
    FROM stripe_webhook_events
    WHERE created_at >= NOW() - INTERVAL '1 hour' * hours_back;
END;
$$;

-- Function to clean up old monitoring data (retention policy)
CREATE OR REPLACE FUNCTION cleanup_monitoring_data()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Delete resolved alerts older than 30 days
    DELETE FROM monitoring_alerts 
    WHERE resolved = TRUE AND resolved_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Delete fal.ai usage data older than 90 days
    DELETE FROM fal_ai_usage 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    -- Delete Stripe webhook events older than 90 days
    DELETE FROM stripe_webhook_events 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    -- Delete system health metrics older than 30 days
    DELETE FROM system_health_metrics 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    RETURN deleted_count;
END;
$$;

-- Create RLS policies for monitoring tables
ALTER TABLE monitoring_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fal_ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_health_metrics ENABLE ROW LEVEL SECURITY;

-- Allow service role to access all monitoring data
CREATE POLICY "Service role can manage monitoring alerts" ON monitoring_alerts
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage fal.ai usage" ON fal_ai_usage
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage stripe webhook events" ON stripe_webhook_events
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage system health metrics" ON system_health_metrics
    FOR ALL USING (auth.role() = 'service_role');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Create a view for monitoring dashboard
CREATE OR REPLACE VIEW monitoring_dashboard AS
SELECT 
    'supabase' as service,
    CASE 
        WHEN cs.connection_utilization > 90 THEN 'critical'
        WHEN cs.connection_utilization > 80 THEN 'warning'
        ELSE 'healthy'
    END as status,
    cs.active_connections,
    cs.max_connections,
    cs.connection_utilization,
    NOW() as last_check
FROM get_connection_stats() cs

UNION ALL

SELECT 
    'fal-ai' as service,
    CASE 
        WHEN fu.error_rate > 20 THEN 'critical'
        WHEN fu.error_rate > 10 OR fu.total_cost > 50 THEN 'warning'
        ELSE 'healthy'
    END as status,
    fu.total_requests as active_connections,
    NULL as max_connections,
    fu.error_rate as connection_utilization,
    NOW() as last_check
FROM get_daily_fal_usage() fu

UNION ALL

SELECT 
    'stripe' as service,
    CASE 
        WHEN swh.success_rate < 90 THEN 'critical'
        WHEN swh.success_rate < 95 THEN 'warning'
        ELSE 'healthy'
    END as status,
    swh.total_webhooks as active_connections,
    NULL as max_connections,
    swh.success_rate as connection_utilization,
    NOW() as last_check
FROM get_stripe_webhook_health() swh;

-- Add comment for documentation
COMMENT ON TABLE monitoring_alerts IS 'Stores system alerts and notifications for monitoring services';
COMMENT ON TABLE fal_ai_usage IS 'Tracks fal.ai API usage, costs, and performance metrics';
COMMENT ON TABLE stripe_webhook_events IS 'Tracks Stripe webhook events and processing status';
COMMENT ON TABLE system_health_metrics IS 'Stores periodic health check results for all services';
COMMENT ON FUNCTION get_connection_stats() IS 'Returns current Supabase connection pool statistics';
COMMENT ON FUNCTION get_daily_fal_usage(DATE) IS 'Returns daily fal.ai usage summary for specified date';
COMMENT ON FUNCTION get_stripe_webhook_health(INTEGER) IS 'Returns Stripe webhook health summary for specified hours back';
COMMENT ON FUNCTION cleanup_monitoring_data() IS 'Cleans up old monitoring data based on retention policies';
