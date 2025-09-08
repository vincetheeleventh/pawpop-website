-- Rollback: 002_rollback_add_user_tracking
-- Description: Revert user tracking and analytics fields

BEGIN;

-- Drop indexes
DROP INDEX IF EXISTS idx_artworks_utm_source;
DROP INDEX IF EXISTS idx_artworks_last_activity;

-- Remove added columns
ALTER TABLE artworks DROP COLUMN IF EXISTS user_agent;
ALTER TABLE artworks DROP COLUMN IF EXISTS ip_address;
ALTER TABLE artworks DROP COLUMN IF EXISTS referrer;
ALTER TABLE artworks DROP COLUMN IF EXISTS utm_source;
ALTER TABLE artworks DROP COLUMN IF EXISTS utm_medium;
ALTER TABLE artworks DROP COLUMN IF EXISTS utm_campaign;
ALTER TABLE artworks DROP COLUMN IF EXISTS conversion_funnel;
ALTER TABLE artworks DROP COLUMN IF EXISTS last_activity_at;

-- Revert version
UPDATE schema_version SET 
  version = 1, 
  applied_at = NOW(),
  description = 'Rollback user tracking fields';

COMMIT;
