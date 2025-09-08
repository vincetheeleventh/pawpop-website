-- Rollback: Restore legacy columns to artworks table
-- This rollback restores the original column structure

-- Add back the legacy image URL columns
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS original_image_url text;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS generated_image_url text;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS original_pet_mom_url text;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS original_pet_url text;

-- Add back the legacy status column
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS generation_status text;

-- Set default values for existing records
UPDATE artworks SET 
  original_image_url = 'migrated',
  generation_status = 'pending'
WHERE original_image_url IS NULL;
