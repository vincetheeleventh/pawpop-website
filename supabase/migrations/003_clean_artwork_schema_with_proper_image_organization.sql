-- Migration: 003_clean_artwork_schema_with_proper_image_organization
-- Description: Reorganize artwork schema with proper image field organization and lifecycle management
-- Author: migration_system
-- Date: 2025-01-08

-- Validate prerequisites
SELECT validate_migration(2);

BEGIN;

-- Add new organized image fields
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS source_images JSONB DEFAULT '{}';
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS generated_images JSONB DEFAULT '{}';
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS delivery_images JSONB DEFAULT '{}';

-- Add generation workflow tracking
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS generation_step TEXT DEFAULT 'pending' 
  CHECK (generation_step IN ('pending', 'monalisa_generation', 'pet_integration', 'upscaling', 'mockup_generation', 'completed', 'failed'));
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS generation_metadata JSONB DEFAULT '{}';

-- Add image processing status tracking
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS processing_status JSONB DEFAULT '{}';

-- Migrate existing data to new structure
UPDATE artworks SET 
  source_images = jsonb_build_object(
    'pet_photo', COALESCE(pet_photo_url, ''),
    'pet_mom_photo', COALESCE(pet_mom_photo_url, ''),
    'uploadthing_keys', '{}'::jsonb
  ),
  generated_images = jsonb_build_object(
    'monalisa_base', '',
    'artwork_preview', COALESCE(generated_image_url, ''),
    'artwork_full_res', COALESCE(upscaled_image_url, ''),
    'generation_steps', '[]'::jsonb
  ),
  delivery_images = jsonb_build_object(
    'digital_download', COALESCE(generated_image_url, ''),
    'print_ready', COALESCE(upscaled_image_url, ''),
    'mockups', COALESCE(mockup_urls, '{}'::jsonb)
  ),
  processing_status = jsonb_build_object(
    'artwork_generation', CASE 
      WHEN status = 'completed' THEN 'completed'
      WHEN status = 'processing' THEN 'processing'
      WHEN status = 'failed' THEN 'failed'
      ELSE 'pending'
    END,
    'upscaling', COALESCE(upscale_status, 'not_required'),
    'mockup_generation', CASE 
      WHEN mockup_urls IS NOT NULL AND jsonb_typeof(mockup_urls) = 'object' AND mockup_urls != '{}'::jsonb THEN 'completed'
      ELSE 'pending'
    END
  ),
  generation_step = CASE 
    WHEN status = 'completed' AND upscale_status IN ('completed', 'not_required') THEN 'completed'
    WHEN status = 'completed' AND upscale_status = 'pending' THEN 'upscaling'
    WHEN status = 'processing' THEN 'pet_integration'
    WHEN status = 'failed' THEN 'failed'
    ELSE 'pending'
  END
WHERE source_images IS NULL OR generated_images IS NULL OR delivery_images IS NULL;

-- Create indexes for new JSONB fields
CREATE INDEX IF NOT EXISTS idx_artworks_generation_step ON artworks(generation_step);
CREATE INDEX IF NOT EXISTS idx_artworks_source_images_gin ON artworks USING GIN (source_images);
CREATE INDEX IF NOT EXISTS idx_artworks_processing_status_gin ON artworks USING GIN (processing_status);

-- Add helper functions for image management
CREATE OR REPLACE FUNCTION get_artwork_image(artwork_id UUID, image_type TEXT, image_key TEXT DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result TEXT;
BEGIN
    CASE image_type
        WHEN 'source' THEN
            SELECT source_images->>image_key INTO result FROM artworks WHERE id = artwork_id;
        WHEN 'generated' THEN
            SELECT generated_images->>image_key INTO result FROM artworks WHERE id = artwork_id;
        WHEN 'delivery' THEN
            SELECT delivery_images->>image_key INTO result FROM artworks WHERE id = artwork_id;
        ELSE
            RAISE EXCEPTION 'Invalid image_type: %. Must be source, generated, or delivery', image_type;
    END CASE;
    
    RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION update_artwork_image(artwork_id UUID, image_type TEXT, image_key TEXT, image_url TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    CASE image_type
        WHEN 'source' THEN
            UPDATE artworks SET 
                source_images = source_images || jsonb_build_object(image_key, image_url),
                updated_at = NOW()
            WHERE id = artwork_id;
        WHEN 'generated' THEN
            UPDATE artworks SET 
                generated_images = generated_images || jsonb_build_object(image_key, image_url),
                updated_at = NOW()
            WHERE id = artwork_id;
        WHEN 'delivery' THEN
            UPDATE artworks SET 
                delivery_images = delivery_images || jsonb_build_object(image_key, image_url),
                updated_at = NOW()
            WHERE id = artwork_id;
        ELSE
            RAISE EXCEPTION 'Invalid image_type: %. Must be source, generated, or delivery', image_type;
    END CASE;
    
    RETURN TRUE;
END;
$$;

-- Update schema version
UPDATE schema_version SET 
  version = 3, 
  applied_at = NOW(),
  description = 'Clean artwork schema with proper image organization and lifecycle management';

COMMIT;