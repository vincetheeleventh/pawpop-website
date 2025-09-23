-- Rollback: Remove FaceSwap Step from Artwork Generation Pipeline
-- Description: Removes faceswap_result field and faceswap enum value
-- Date: 2025-01-22
-- Version: 009

-- Drop the helper functions
DROP FUNCTION IF EXISTS get_artworks_needing_faceswap();
DROP FUNCTION IF EXISTS update_artwork_faceswap_result(uuid, text);

-- Drop the index
DROP INDEX IF EXISTS idx_artworks_faceswap_step;

-- Note: PostgreSQL doesn't allow removing enum values directly
-- If you need to remove the 'faceswap' enum value, you would need to:
-- 1. Create a new enum without 'faceswap'
-- 2. Update all columns to use the new enum
-- 3. Drop the old enum
-- This is complex and potentially destructive, so we'll leave the enum value

-- Update comment to reflect rollback
COMMENT ON COLUMN artworks.generated_images IS 'JSONB structure: {
  "monalisa_base": "url_to_monalisa_portrait",
  "artwork_preview": "url_to_preview_image", 
  "artwork_full_res": "url_to_full_resolution_image",
  "generation_steps": []
}';

-- Remove schema version entry
DELETE FROM schema_migrations WHERE version = '009';
