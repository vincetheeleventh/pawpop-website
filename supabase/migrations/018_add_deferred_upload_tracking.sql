-- Migration: Add deferred upload tracking for email-first flow
-- Description: Enables email capture before photo uploads with reminder system
-- Created: 2025-01-29

-- Add columns to artworks table for deferred upload tracking
ALTER TABLE artworks 
ADD COLUMN IF NOT EXISTS email_captured_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS upload_deferred BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS upload_reminder_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS upload_reminder_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS upload_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS upload_token TEXT UNIQUE;

-- Create index for efficient querying of deferred uploads
CREATE INDEX IF NOT EXISTS idx_artworks_upload_deferred 
ON artworks(upload_deferred, email_captured_at) 
WHERE upload_deferred = true;

-- Create index for upload token lookups
CREATE INDEX IF NOT EXISTS idx_artworks_upload_token 
ON artworks(upload_token) 
WHERE upload_token IS NOT NULL;

-- Create index for reminder scheduling
CREATE INDEX IF NOT EXISTS idx_artworks_reminder_scheduling 
ON artworks(upload_reminder_sent_at, upload_reminder_count) 
WHERE upload_deferred = true AND generation_step = 'pending';

-- Function to generate unique upload token
CREATE OR REPLACE FUNCTION generate_upload_token()
RETURNS TEXT AS $$
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
    SELECT EXISTS(SELECT 1 FROM artworks WHERE upload_token = token) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  
  RETURN token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get artworks needing upload reminders
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
    a.id,
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

-- Function to mark reminder as sent
CREATE OR REPLACE FUNCTION mark_reminder_sent(artwork_id_param TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE artworks
  SET 
    upload_reminder_sent_at = NOW(),
    upload_reminder_count = upload_reminder_count + 1,
    updated_at = NOW()
  WHERE id = artwork_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete deferred upload
CREATE OR REPLACE FUNCTION complete_deferred_upload(artwork_id_param TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE artworks
  SET 
    upload_deferred = false,
    upload_completed_at = NOW(),
    updated_at = NOW()
  WHERE id = artwork_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment for documentation
COMMENT ON COLUMN artworks.email_captured_at IS 'Timestamp when email was first captured (before photo upload)';
COMMENT ON COLUMN artworks.upload_deferred IS 'True if user chose to upload photos later';
COMMENT ON COLUMN artworks.upload_reminder_sent_at IS 'Timestamp of most recent upload reminder email';
COMMENT ON COLUMN artworks.upload_reminder_count IS 'Number of reminder emails sent (max 3)';
COMMENT ON COLUMN artworks.upload_completed_at IS 'Timestamp when deferred upload was completed';
COMMENT ON COLUMN artworks.upload_token IS 'Unique token for deferred upload link';

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION generate_upload_token() TO authenticated;
GRANT EXECUTE ON FUNCTION get_artworks_needing_reminders(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_reminder_sent(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_deferred_upload(TEXT) TO authenticated;
