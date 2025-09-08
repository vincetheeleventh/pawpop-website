-- Rollback: 003_rollback_clean_artwork_schema_with_proper_image_organization
-- Description: Revert clean artwork schema with proper image organization

BEGIN;

-- Drop helper functions
DROP FUNCTION IF EXISTS get_artwork_image(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS update_artwork_image(UUID, TEXT, TEXT, TEXT);

-- Drop indexes
DROP INDEX IF EXISTS idx_artworks_generation_step;
DROP INDEX IF EXISTS idx_artworks_source_images_gin;
DROP INDEX IF EXISTS idx_artworks_processing_status_gin;

-- Remove new columns
ALTER TABLE artworks DROP COLUMN IF EXISTS source_images;
ALTER TABLE artworks DROP COLUMN IF EXISTS generated_images;
ALTER TABLE artworks DROP COLUMN IF EXISTS delivery_images;
ALTER TABLE artworks DROP COLUMN IF EXISTS generation_step;
ALTER TABLE artworks DROP COLUMN IF EXISTS generation_metadata;
ALTER TABLE artworks DROP COLUMN IF EXISTS processing_status;

-- Revert version
UPDATE schema_version SET 
  version = 2, 
  applied_at = NOW(),
  description = 'Rollback clean artwork schema with proper image organization';

COMMIT;