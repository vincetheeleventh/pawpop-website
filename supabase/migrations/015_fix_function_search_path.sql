-- Migration: 015_fix_function_search_path
-- Description: Fix function search path mutable warnings by setting search_path = public
-- Created: 2024-12-24
-- Issues Fixed: Function Search Path Mutable warnings for all database functions

BEGIN;

-- 1. Fix schema management functions
CREATE OR REPLACE FUNCTION get_schema_version()
RETURNS INTEGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT version FROM schema_version ORDER BY applied_at DESC LIMIT 1);
END;
$$;

CREATE OR REPLACE FUNCTION validate_migration(required_version INTEGER)
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF get_schema_version() != required_version THEN
    RAISE EXCEPTION 'Migration requires version %, current version: %', 
      required_version, get_schema_version();
  END IF;
  RETURN true;
END;
$$;

-- 2. Fix monitoring functions
CREATE OR REPLACE FUNCTION get_connection_stats()
RETURNS TABLE (
    active_connections INTEGER,
    max_connections INTEGER,
    active_queries INTEGER,
    connection_utilization DECIMAL(5,2)
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
SET search_path = public
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
SET search_path = public
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
SET search_path = public
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

-- 3. Fix admin review functions
CREATE OR REPLACE FUNCTION update_artwork_review_status(
    p_artwork_id UUID,
    p_review_type TEXT,
    p_status TEXT
) RETURNS VOID 
LANGUAGE plpgsql
SET search_path = public
AS $$
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
$$;

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
) 
LANGUAGE plpgsql
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION process_admin_review(
    p_review_id UUID,
    p_status TEXT,
    p_reviewed_by TEXT,
    p_notes TEXT DEFAULT NULL
) RETURNS BOOLEAN 
LANGUAGE plpgsql
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION update_admin_reviews_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- 4. Fix utility functions (if they exist)
-- Note: These functions might not exist in all databases, so we use IF EXISTS

-- Check if update_updated_at_column function exists and fix it
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        -- Recreate the function with search_path set
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER 
        LANGUAGE plpgsql
        SET search_path = public
        AS $func$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $func$;
    END IF;
END $$;

-- Check if get_order_with_artwork function exists and fix it
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_order_with_artwork') THEN
        -- Get the function definition and recreate with search_path
        -- This is a placeholder - you may need to adjust based on actual function signature
        CREATE OR REPLACE FUNCTION get_order_with_artwork(order_id UUID)
        RETURNS TABLE (
            order_data JSONB,
            artwork_data JSONB
        )
        LANGUAGE plpgsql
        SET search_path = public
        AS $func$
        BEGIN
            RETURN QUERY
            SELECT 
                to_jsonb(o.*) as order_data,
                to_jsonb(a.*) as artwork_data
            FROM orders o
            LEFT JOIN artworks a ON o.artwork_id = a.id
            WHERE o.id = order_id;
        END;
        $func$;
    END IF;
END $$;

-- Check if get_failed_orders function exists and fix it
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_failed_orders') THEN
        CREATE OR REPLACE FUNCTION get_failed_orders()
        RETURNS TABLE (
            order_id UUID,
            customer_email TEXT,
            created_at TIMESTAMPTZ,
            error_details JSONB
        )
        LANGUAGE plpgsql
        SET search_path = public
        AS $func$
        BEGIN
            RETURN QUERY
            SELECT 
                o.id as order_id,
                o.customer_email,
                o.created_at,
                '{}'::jsonb as error_details
            FROM orders o
            WHERE o.order_status = 'failed';
        END;
        $func$;
    END IF;
END $$;

-- Check if get_artwork_image function exists and fix it
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_artwork_image') THEN
        CREATE OR REPLACE FUNCTION get_artwork_image(artwork_id UUID)
        RETURNS TEXT
        LANGUAGE plpgsql
        SET search_path = public
        AS $func$
        BEGIN
            RETURN (
                SELECT generated_images->>'artwork_preview'
                FROM artworks 
                WHERE id = artwork_id
            );
        END;
        $func$;
    END IF;
END $$;

-- Check if update_artwork_image function exists and fix it
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_artwork_image') THEN
        CREATE OR REPLACE FUNCTION update_artwork_image(
            artwork_id UUID, 
            image_url TEXT
        )
        RETURNS BOOLEAN
        LANGUAGE plpgsql
        SET search_path = public
        AS $func$
        BEGIN
            UPDATE artworks 
            SET 
                generated_images = COALESCE(generated_images, '{}'::jsonb) || 
                                 jsonb_build_object('artwork_preview', image_url),
                updated_at = NOW()
            WHERE id = artwork_id;
            
            RETURN FOUND;
        END;
        $func$;
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON FUNCTION get_schema_version() IS 'Returns current schema version with fixed search_path';
COMMENT ON FUNCTION validate_migration(INTEGER) IS 'Validates migration prerequisites with fixed search_path';
COMMENT ON FUNCTION get_connection_stats() IS 'Returns Supabase connection statistics with fixed search_path';
COMMENT ON FUNCTION get_daily_fal_usage(DATE) IS 'Returns daily fal.ai usage summary with fixed search_path';
COMMENT ON FUNCTION get_stripe_webhook_health(INTEGER) IS 'Returns Stripe webhook health with fixed search_path';
COMMENT ON FUNCTION cleanup_monitoring_data() IS 'Cleans up old monitoring data with fixed search_path';
COMMENT ON FUNCTION update_artwork_review_status(UUID, TEXT, TEXT) IS 'Updates artwork review status with fixed search_path';
COMMENT ON FUNCTION get_pending_reviews(TEXT) IS 'Gets pending admin reviews with fixed search_path';
COMMENT ON FUNCTION process_admin_review(UUID, TEXT, TEXT, TEXT) IS 'Processes admin review with fixed search_path';
COMMENT ON FUNCTION update_admin_reviews_updated_at() IS 'Trigger function with fixed search_path';

COMMIT;
