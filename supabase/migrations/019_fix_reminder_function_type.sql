-- Migration: Fix get_artworks_needing_reminders function type mismatch
-- Description: Cast UUID to TEXT for artwork_id return value
-- Created: 2025-01-29

-- Drop and recreate function with proper type casting
CREATE OR REPLACE FUNCTION get_artworks_needing_reminders(
  hours_since_capture INTEGER DEFAULT 24,
  max_reminders INTEGER DEFAULT 3
)
RETURNS TABLE (
  artwork_id TEXT,
  customer_email TEXT,
  customer_name TEXT,
  email_captured_at TIMESTAMPTZ,
  upload_reminder_count INTEGER,
  upload_token TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id::TEXT,  -- Cast UUID to TEXT
    a.customer_email,
    a.customer_name,
    a.email_captured_at,
    a.upload_reminder_count,
    a.upload_token
  FROM artworks a
  WHERE a.upload_deferred = true
    AND a.generation_step = 'pending'
    AND a.upload_reminder_count < max_reminders
    AND (
      -- First reminder: 24 hours after capture
      (a.upload_reminder_count = 0 AND a.email_captured_at < NOW() - (hours_since_capture || ' hours')::INTERVAL)
      OR
      -- Subsequent reminders: 48 hours after last reminder
      (a.upload_reminder_count > 0 AND a.upload_reminder_sent_at < NOW() - INTERVAL '48 hours')
    )
  ORDER BY a.email_captured_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_artworks_needing_reminders(INTEGER, INTEGER) TO authenticated;
