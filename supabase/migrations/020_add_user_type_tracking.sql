-- Migration: Add user_type tracking for gifter vs self-purchaser analytics
-- Created: 2025-09-30
-- Description: Adds user_type column to artworks table to track whether the user is buying for themselves or as a gift

-- Add user_type column to artworks table
ALTER TABLE artworks 
ADD COLUMN IF NOT EXISTS user_type TEXT CHECK (user_type IN ('gifter', 'self_purchaser'));

-- Add index for analytics queries
CREATE INDEX IF NOT EXISTS idx_artworks_user_type ON artworks(user_type);

-- Add comment for documentation
COMMENT ON COLUMN artworks.user_type IS 'Tracks whether the artwork is for a gift (gifter) or for themselves (self_purchaser)';

-- Update RLS policies to include user_type (if needed)
-- Note: user_type is not sensitive data, so existing policies should work fine

-- Create a view for user_type analytics
CREATE OR REPLACE VIEW user_type_analytics AS
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
