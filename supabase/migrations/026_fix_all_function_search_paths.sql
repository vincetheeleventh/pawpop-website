-- Migration: Fix search_path for all functions
-- Created: 2025-10-15
-- Description: Adds SET search_path = '' to all functions to prevent security issues with mutable search paths
--              This ensures functions use an explicit, immutable search path

-- 1. update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

-- 2. generate_upload_token
CREATE OR REPLACE FUNCTION public.generate_upload_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  token TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate random 32-character token
    token := encode(gen_random_bytes(24), 'base64');
    token := replace(replace(replace(token, '+', ''), '/', ''), '=', '');
    token := substring(token, 1, 32);
    
    -- Check if token already exists
    SELECT EXISTS(SELECT 1 FROM public.artworks WHERE upload_token = token) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  
  RETURN token;
END;
$function$;

-- 3. create_or_get_user_by_email
CREATE OR REPLACE FUNCTION public.create_or_get_user_by_email(p_email text, p_customer_name text DEFAULT ''::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_user_id UUID;
BEGIN
  -- Try to find existing user by email in auth.users
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email
  LIMIT 1;
  
  -- If user doesn't exist, create a passwordless user
  IF v_user_id IS NULL THEN
    -- Insert into auth.users (requires service role)
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      p_email,
      crypt('', gen_salt('bf')), -- Passwordless - empty password
      NOW(), -- Auto-confirm email
      jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
      jsonb_build_object('customer_name', p_customer_name),
      NOW(),
      NOW(),
      '',
      ''
    )
    RETURNING id INTO v_user_id;
  END IF;
  
  RETURN v_user_id;
END;
$function$;

-- 4. get_schema_version
CREATE OR REPLACE FUNCTION public.get_schema_version()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  RETURN COALESCE((SELECT version FROM public.schema_version ORDER BY applied_at DESC LIMIT 1), 0);
END;
$function$;

-- 5. validate_migration
CREATE OR REPLACE FUNCTION public.validate_migration(required_version integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF public.get_schema_version() != required_version THEN
    RAISE EXCEPTION 'Migration requires version %, current version: %', 
      required_version, public.get_schema_version();
  END IF;
  RETURN true;
END;
$function$;

-- 6. get_order_with_artwork
CREATE OR REPLACE FUNCTION public.get_order_with_artwork(order_stripe_session_id text)
RETURNS TABLE(order_id uuid, artwork_id uuid, stripe_session_id text, product_type text, product_size text, customer_name text, customer_email text, order_status text, printify_order_id text, generated_image_url text, pet_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.artwork_id,
        o.stripe_session_id,
        o.product_type,
        o.product_size,
        o.customer_name,
        o.customer_email,
        o.order_status,
        o.printify_order_id,
        a.generated_image_url,
        a.pet_name
    FROM public.orders o
    JOIN public.artworks a ON o.artwork_id = a.id
    WHERE o.stripe_session_id = order_stripe_session_id;
END;
$function$;

-- 7. get_failed_orders
CREATE OR REPLACE FUNCTION public.get_failed_orders()
RETURNS TABLE(order_id uuid, artwork_id uuid, stripe_session_id text, product_type text, product_size text, customer_name text, generated_image_url text, pet_name text, shipping_address jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.artwork_id,
        o.stripe_session_id,
        o.product_type,
        o.product_size,
        o.customer_name,
        a.generated_image_url,
        a.pet_name,
        o.shipping_address
    FROM public.orders o
    JOIN public.artworks a ON o.artwork_id = a.id
    WHERE o.order_status = 'paid'
    AND o.printify_order_id IS NULL
    AND o.product_type != 'digital'
    ORDER BY o.created_at ASC;
END;
$function$;

-- 8. get_connection_stats
CREATE OR REPLACE FUNCTION public.get_connection_stats()
RETURNS TABLE(active_connections integer, max_connections integer, active_queries integer, connection_utilization numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
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
$function$;

-- 9. get_artwork_image
CREATE OR REPLACE FUNCTION public.get_artwork_image(artwork_id uuid, image_type text, image_key text DEFAULT NULL::text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    result TEXT;
BEGIN
    CASE image_type
        WHEN 'source' THEN
            SELECT source_images->>image_key INTO result FROM public.artworks WHERE id = artwork_id;
        WHEN 'generated' THEN
            SELECT generated_images->>image_key INTO result FROM public.artworks WHERE id = artwork_id;
        WHEN 'delivery' THEN
            SELECT delivery_images->>image_key INTO result FROM public.artworks WHERE id = artwork_id;
        ELSE
            RAISE EXCEPTION 'Invalid image_type: %. Must be source, generated, or delivery', image_type;
    END CASE;
    
    RETURN result;
END;
$function$;

-- 10. update_artwork_image
CREATE OR REPLACE FUNCTION public.update_artwork_image(artwork_id uuid, image_type text, image_key text, image_url text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    CASE image_type
        WHEN 'source' THEN
            UPDATE public.artworks SET 
                source_images = source_images || jsonb_build_object(image_key, image_url),
                updated_at = NOW()
            WHERE id = artwork_id;
        WHEN 'generated' THEN
            UPDATE public.artworks SET 
                generated_images = generated_images || jsonb_build_object(image_key, image_url),
                updated_at = NOW()
            WHERE id = artwork_id;
        WHEN 'delivery' THEN
            UPDATE public.artworks SET 
                delivery_images = delivery_images || jsonb_build_object(image_key, image_url),
                updated_at = NOW()
            WHERE id = artwork_id;
        ELSE
            RAISE EXCEPTION 'Invalid image_type: %. Must be source, generated, or delivery', image_type;
    END CASE;
    
    RETURN TRUE;
END;
$function$;

-- 11. get_daily_fal_usage
CREATE OR REPLACE FUNCTION public.get_daily_fal_usage(target_date date DEFAULT CURRENT_DATE)
RETURNS TABLE(total_requests integer, successful_requests integer, failed_requests integer, total_cost numeric, avg_response_time numeric, error_rate numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
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
    FROM public.fal_ai_usage
    WHERE DATE(created_at) = target_date;
END;
$function$;

-- 12. get_stripe_webhook_health
CREATE OR REPLACE FUNCTION public.get_stripe_webhook_health(hours_back integer DEFAULT 24)
RETURNS TABLE(total_webhooks integer, successful_webhooks integer, failed_webhooks integer, success_rate numeric, avg_processing_time numeric, last_webhook_time timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
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
    FROM public.stripe_webhook_events
    WHERE created_at >= NOW() - INTERVAL '1 hour' * hours_back;
END;
$function$;

-- 13. cleanup_monitoring_data
CREATE OR REPLACE FUNCTION public.cleanup_monitoring_data()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Delete resolved alerts older than 30 days
    DELETE FROM public.monitoring_alerts 
    WHERE resolved = TRUE AND resolved_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Delete fal.ai usage data older than 90 days
    DELETE FROM public.fal_ai_usage 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    -- Delete Stripe webhook events older than 90 days
    DELETE FROM public.stripe_webhook_events 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    -- Delete system health metrics older than 30 days
    DELETE FROM public.system_health_metrics 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    RETURN deleted_count;
END;
$function$;

-- 14. mark_reminder_sent
CREATE OR REPLACE FUNCTION public.mark_reminder_sent(artwork_id_param text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  UPDATE public.artworks
  SET 
    upload_reminder_sent_at = NOW(),
    upload_reminder_count = upload_reminder_count + 1,
    updated_at = NOW()
  WHERE id = artwork_id_param;
END;
$function$;

-- 15. complete_deferred_upload
CREATE OR REPLACE FUNCTION public.complete_deferred_upload(artwork_id_param text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  UPDATE public.artworks
  SET 
    upload_deferred = false,
    upload_completed_at = NOW(),
    updated_at = NOW()
  WHERE id = artwork_id_param;
END;
$function$;

-- 16. get_pending_reviews
CREATE OR REPLACE FUNCTION public.get_pending_reviews(p_review_type text DEFAULT NULL::text)
RETURNS TABLE(id uuid, review_id uuid, artwork_id uuid, review_type character varying, status character varying, image_url text, fal_generation_url text, customer_name text, customer_email text, pet_name text, review_notes text, reviewed_by text, reviewed_at timestamp with time zone, created_at timestamp with time zone, artwork_token text, edit_request_text text)
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        ar.id,
        ar.id as review_id,
        ar.artwork_id,
        ar.review_type,
        ar.status,
        ar.image_url,
        ar.fal_generation_url,
        ar.customer_name,
        ar.customer_email,
        ar.pet_name,
        ar.review_notes,
        ar.reviewed_by,
        ar.reviewed_at,
        ar.created_at,
        a.access_token as artwork_token,
        ar.edit_request_text
    FROM public.admin_reviews ar
    JOIN public.artworks a ON ar.artwork_id = a.id
    WHERE ar.status = 'pending'
    AND (p_review_type IS NULL OR ar.review_type = p_review_type)
    ORDER BY ar.created_at ASC;
END;
$function$;

-- 17. get_artworks_needing_reminders
CREATE OR REPLACE FUNCTION public.get_artworks_needing_reminders(hours_since_capture integer DEFAULT 24, max_reminders integer DEFAULT 3)
RETURNS TABLE(artwork_id text, customer_email text, customer_name text, email_captured_at timestamp with time zone, upload_reminder_count integer, upload_token text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    a.id::TEXT,
    a.customer_email,
    a.customer_name,
    a.email_captured_at,
    a.upload_reminder_count,
    a.upload_token
  FROM public.artworks a
  WHERE a.upload_deferred = true
    AND a.generation_step = 'pending'
    AND a.upload_reminder_count < max_reminders
    AND (
      (a.upload_reminder_count = 0 AND a.email_captured_at < NOW() - (hours_since_capture || ' hours')::INTERVAL)
      OR
      (a.upload_reminder_count > 0 AND a.upload_reminder_sent_at < NOW() - INTERVAL '48 hours')
    )
  ORDER BY a.email_captured_at ASC;
END;
$function$;

-- 18. update_artwork_review_status
CREATE OR REPLACE FUNCTION public.update_artwork_review_status(p_artwork_id uuid, p_review_type text, p_status text)
RETURNS void
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
    UPDATE public.artworks 
    SET 
        review_status = COALESCE(review_status, '{}'::jsonb) || 
                       jsonb_build_object(p_review_type, jsonb_build_object(
                           'status', p_status,
                           'updated_at', NOW()
                       )),
        updated_at = NOW()
    WHERE id = p_artwork_id;
END;
$function$;

-- 19. process_admin_review
CREATE OR REPLACE FUNCTION public.process_admin_review(p_review_id uuid, p_status text, p_reviewed_by text, p_notes text DEFAULT NULL::text)
RETURNS boolean
LANGUAGE plpgsql
SET search_path = ''
AS $function$
DECLARE
    v_artwork_id UUID;
    v_review_type TEXT;
BEGIN
    -- Validate status
    IF p_status NOT IN ('approved', 'rejected') THEN
        RAISE EXCEPTION 'Invalid status. Must be approved or rejected.';
    END IF;
    
    -- Update the review
    UPDATE public.admin_reviews 
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
    PERFORM public.update_artwork_review_status(v_artwork_id, v_review_type, p_status);
    
    RETURN TRUE;
END;
$function$;

-- 20. update_admin_reviews_updated_at
CREATE OR REPLACE FUNCTION public.update_admin_reviews_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

-- Add comments for documentation
COMMENT ON FUNCTION public.update_updated_at_column IS 'Trigger function with immutable search_path for security';
COMMENT ON FUNCTION public.generate_upload_token IS 'Token generation function with immutable search_path for security';
COMMENT ON FUNCTION public.create_or_get_user_by_email IS 'User management function with immutable search_path for security';
COMMENT ON FUNCTION public.get_schema_version IS 'Schema version function with immutable search_path for security';
COMMENT ON FUNCTION public.validate_migration IS 'Migration validation function with immutable search_path for security';
COMMENT ON FUNCTION public.get_order_with_artwork IS 'Order query function with immutable search_path for security';
COMMENT ON FUNCTION public.get_failed_orders IS 'Failed orders query with immutable search_path for security';
COMMENT ON FUNCTION public.get_connection_stats IS 'Database stats function with immutable search_path for security';
COMMENT ON FUNCTION public.get_artwork_image IS 'Image getter function with immutable search_path for security';
COMMENT ON FUNCTION public.update_artwork_image IS 'Image updater function with immutable search_path for security';
COMMENT ON FUNCTION public.get_daily_fal_usage IS 'FAL usage stats with immutable search_path for security';
COMMENT ON FUNCTION public.get_stripe_webhook_health IS 'Stripe webhook health with immutable search_path for security';
COMMENT ON FUNCTION public.cleanup_monitoring_data IS 'Cleanup function with immutable search_path for security';
COMMENT ON FUNCTION public.mark_reminder_sent IS 'Reminder tracking with immutable search_path for security';
COMMENT ON FUNCTION public.complete_deferred_upload IS 'Upload completion with immutable search_path for security';
COMMENT ON FUNCTION public.get_pending_reviews IS 'Admin reviews query with immutable search_path for security';
COMMENT ON FUNCTION public.get_artworks_needing_reminders IS 'Reminder query with immutable search_path for security';
COMMENT ON FUNCTION public.update_artwork_review_status IS 'Review status update with immutable search_path for security';
COMMENT ON FUNCTION public.process_admin_review IS 'Review processing with immutable search_path for security';
COMMENT ON FUNCTION public.update_admin_reviews_updated_at IS 'Trigger function with immutable search_path for security';
