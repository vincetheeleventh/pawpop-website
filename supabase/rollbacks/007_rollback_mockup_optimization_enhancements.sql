-- Rollback: 007_rollback_mockup_optimization_enhancements.sql
-- Description: Rollback mockup optimization enhancements
-- Date: 2025-09-19
-- Rolls back: 007_mockup_optimization_enhancements.sql

-- Drop helper function
DROP FUNCTION IF EXISTS has_cached_mockups(JSONB);

-- Drop constraint
ALTER TABLE artworks 
DROP CONSTRAINT IF EXISTS delivery_images_is_valid_json;

-- Drop indexes (in reverse order of creation)
DROP INDEX IF EXISTS idx_artworks_access_token_with_mockups;
DROP INDEX IF EXISTS idx_artworks_has_mockups;
DROP INDEX IF EXISTS idx_artworks_delivery_images_gin;

-- Remove from schema version tracking
DELETE FROM schema_migrations WHERE version = '007';
