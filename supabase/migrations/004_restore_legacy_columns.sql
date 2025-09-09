-- Migration: 004_restore_legacy_columns
-- Description: Restore legacy columns needed by existing code
-- Author: migration_system
-- Date: 2025-01-08

-- Validate prerequisites
SELECT validate_migration(3);

BEGIN;

-- Add back the legacy image URL columns
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS original_image_url text;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS generated_image_url text;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS original_pet_mom_url text;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS original_pet_url text;

-- Add back the legacy status columns
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS generation_status text DEFAULT 'pending';
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS upscale_status text DEFAULT 'not_required';

-- Add missing columns for backward compatibility
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS upscaled_image_url text;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS mockup_urls jsonb DEFAULT '{}';

-- Set default values for existing records
UPDATE artworks SET 
  original_image_url = COALESCE(original_image_url, 'pending'),
  generation_status = COALESCE(generation_status, 'pending'),
  upscale_status = COALESCE(upscale_status, 'not_required'),
  status = COALESCE(status, 'pending')
WHERE original_image_url IS NULL OR generation_status IS NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_artworks_generation_status ON artworks(generation_status);
CREATE INDEX IF NOT EXISTS idx_artworks_upscale_status ON artworks(upscale_status);
CREATE INDEX IF NOT EXISTS idx_artworks_status ON artworks(status);

-- Update schema version
UPDATE schema_version SET 
  version = 4, 
  applied_at = NOW(),
  description = 'Restore legacy columns for backward compatibility';

COMMIT;
