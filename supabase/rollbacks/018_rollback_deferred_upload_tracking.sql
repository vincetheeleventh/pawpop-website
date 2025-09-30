-- Rollback: Remove deferred upload tracking
-- Reverts migration 018_add_deferred_upload_tracking.sql

-- Drop functions
DROP FUNCTION IF EXISTS complete_deferred_upload(TEXT);
DROP FUNCTION IF EXISTS mark_reminder_sent(TEXT);
DROP FUNCTION IF EXISTS get_artworks_needing_reminders(INTEGER, INTEGER);
DROP FUNCTION IF EXISTS generate_upload_token();

-- Drop indexes
DROP INDEX IF EXISTS idx_artworks_reminder_scheduling;
DROP INDEX IF EXISTS idx_artworks_upload_token;
DROP INDEX IF EXISTS idx_artworks_upload_deferred;

-- Remove columns from artworks table
ALTER TABLE artworks 
DROP COLUMN IF EXISTS upload_token,
DROP COLUMN IF EXISTS upload_completed_at,
DROP COLUMN IF EXISTS upload_reminder_count,
DROP COLUMN IF EXISTS upload_reminder_sent_at,
DROP COLUMN IF EXISTS upload_deferred,
DROP COLUMN IF EXISTS email_captured_at;
