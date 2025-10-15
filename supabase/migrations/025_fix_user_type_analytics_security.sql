-- Migration: Fix user_type_analytics view security definer issue
-- Created: 2025-10-15
-- Description: Updates user_type_analytics view to use SECURITY INVOKER instead of SECURITY DEFINER
--              This ensures the view runs with the privileges of the querying user, not the view creator

-- Drop the existing view
DROP VIEW IF EXISTS user_type_analytics;

-- Recreate the view with SECURITY INVOKER
CREATE OR REPLACE VIEW user_type_analytics
WITH (security_invoker = true)
AS
SELECT 
  user_type,
  COUNT(*) as total_artworks,
  COUNT(CASE WHEN generation_step = 'completed' THEN 1 END) as completed_artworks,
  COUNT(CASE WHEN email_captured_at IS NOT NULL THEN 1 END) as emails_captured,
  COUNT(CASE WHEN upload_deferred = true THEN 1 END) as deferred_uploads,
  ROUND(
    COUNT(CASE WHEN generation_step = 'completed' THEN 1 END)::numeric / 
    NULLIF(COUNT(*), 0) * 100, 
    2
  ) as completion_rate_percent
FROM artworks
WHERE user_type IS NOT NULL
GROUP BY user_type;

-- Grant access to the view
GRANT SELECT ON user_type_analytics TO authenticated;
GRANT SELECT ON user_type_analytics TO service_role;

-- Add comment for documentation
COMMENT ON VIEW user_type_analytics IS 'Analytics view for user types (gifter vs self_purchaser) - uses SECURITY INVOKER for proper RLS enforcement';
