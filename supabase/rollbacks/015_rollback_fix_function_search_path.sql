-- Rollback Migration: 015_rollback_fix_function_search_path
-- Description: Rollback function search path fixes
-- Created: 2024-12-24

BEGIN;

-- Note: This rollback removes the SET search_path = public from all functions
-- The functions will revert to having mutable search_path (the original warning state)

-- 1. Rollback schema management functions
CREATE OR REPLACE FUNCTION get_schema_version()
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT version FROM schema_version ORDER BY applied_at DESC LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION validate_migration(required_version INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
  IF get_schema_version() != required_version THEN
    RAISE EXCEPTION 'Migration requires version %, current version: %', 
      required_version, get_schema_version();
  END IF;
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Rollback monitoring functions
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

-- 3. Rollback admin review functions
CREATE OR REPLACE FUNCTION update_artwork_review_status(
    p_artwork_id UUID,
    p_review_type TEXT,
    p_status TEXT
) RETURNS VOID AS $$
BEGIN
    UPDATE artworks 
    SET 
        review_status = COALESCE(review_status, '{}'::jsonb) || 
                       jsonb_build_object(p_review_type, jsonb_build_object(
                           'status', p_status,
                           'updated_at', NOW()
                       )),
        updated_at = NOW()
    WHERE id = p_artwork_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_pending_reviews(p_review_type TEXT DEFAULT NULL)
RETURNS TABLE (
    review_id UUID,
    artwork_id UUID,
    review_type TEXT,
    status TEXT,
    image_url TEXT,
    fal_generation_url TEXT,
    customer_name TEXT,
    customer_email TEXT,
    pet_name TEXT,
    review_notes TEXT,
    reviewed_by TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    artwork_token TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ar.id as review_id,
        ar.artwork_id,
        ar.review_type::TEXT,
        ar.status::TEXT,
        ar.image_url,
        ar.fal_generation_url,
        ar.customer_name,
        ar.customer_email,
        ar.pet_name,
        ar.review_notes,
        ar.reviewed_by,
        ar.reviewed_at,
        ar.created_at,
        a.access_token as artwork_token
    FROM admin_reviews ar
    JOIN artworks a ON ar.artwork_id = a.id
    WHERE (p_review_type IS NULL OR ar.review_type = p_review_type)
    ORDER BY ar.created_at ASC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION process_admin_review(
    p_review_id UUID,
    p_status TEXT,
    p_reviewed_by TEXT,
    p_notes TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_artwork_id UUID;
    v_review_type TEXT;
BEGIN
    -- Validate status
    IF p_status NOT IN ('approved', 'rejected') THEN
        RAISE EXCEPTION 'Invalid status. Must be approved or rejected.';
    END IF;
    
    -- Update the review
    UPDATE admin_reviews 
    SET 
        status = p_status,
        reviewed_by = p_reviewed_by,
        reviewed_at = NOW(),
        review_notes = p_notes,
        updated_at = NOW()
    WHERE id = p_review_id
    RETURNING artwork_id, review_type INTO v_artwork_id, v_review_type;
    
    -- Check if review was found
    IF v_artwork_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Update artwork review status
    PERFORM update_artwork_review_status(v_artwork_id, v_review_type, p_status);
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_admin_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMIT;
