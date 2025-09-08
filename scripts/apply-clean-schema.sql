-- Direct Schema Application for Clean Image Organization
-- Run this in Supabase SQL Editor to apply the cleaned schema
-- This works with your existing schema structure

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

-- Migrate existing data to new structure (using actual column names)
UPDATE artworks SET 
  source_images = jsonb_build_object(
    'pet_photo', COALESCE(original_pet_url, ''),
    'pet_mom_photo', COALESCE(original_pet_mom_url, ''),
    'uploadthing_keys', '{}'::jsonb
  ),
  generated_images = jsonb_build_object(
    'monalisa_base', COALESCE(original_image_url, ''),
    'artwork_preview', COALESCE(generated_image_url, ''),
    'artwork_full_res', '',
    'generation_steps', '[]'::jsonb
  ),
  delivery_images = jsonb_build_object(
    'digital_download', COALESCE(generated_image_url, ''),
    'print_ready', COALESCE(generated_image_url, ''),
    'mockups', '{}'::jsonb
  ),
  processing_status = jsonb_build_object(
    'artwork_generation', CASE 
      WHEN generation_status = 'completed' THEN 'completed'
      WHEN generation_status = 'processing' THEN 'processing'
      WHEN generation_status = 'failed' THEN 'failed'
      ELSE 'pending'
    END,
    'upscaling', 'not_required',
    'mockup_generation', 'pending'
  ),
  generation_step = CASE 
    WHEN generation_status = 'completed' THEN 'completed'
    WHEN generation_status = 'processing' THEN 'pet_integration'
    WHEN generation_status = 'failed' THEN 'failed'
    ELSE 'pending'
  END
WHERE source_images IS NULL OR generated_images IS NULL OR delivery_images IS NULL;

-- Create indexes for performance (using actual column names)
CREATE INDEX IF NOT EXISTS idx_artworks_access_token ON artworks(access_token);
CREATE INDEX IF NOT EXISTS idx_artworks_email ON artworks(customer_email);
CREATE INDEX IF NOT EXISTS idx_artworks_generation_status ON artworks(generation_status);
CREATE INDEX IF NOT EXISTS idx_artworks_generation_step ON artworks(generation_step);
CREATE INDEX IF NOT EXISTS idx_artworks_source_images_gin ON artworks USING GIN (source_images);
CREATE INDEX IF NOT EXISTS idx_artworks_processing_status_gin ON artworks USING GIN (processing_status);

-- Enable Row Level Security (if not already enabled)
ALTER TABLE artworks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for artworks (if not already exist)
DROP POLICY IF EXISTS "Artworks are accessible via access token" ON artworks;
CREATE POLICY "Artworks are accessible via access token" ON artworks
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Service role full access to artworks" ON artworks;
CREATE POLICY "Service role full access to artworks" ON artworks
  FOR ALL TO service_role USING (true);

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

-- Update schema version to reflect the clean schema
UPDATE schema_version SET 
  version = 3, 
  applied_at = NOW(),
  description = 'Clean artwork schema with proper image organization applied directly';

-- Verify the setup
SELECT 
  'Clean schema applied successfully!' as status,
  get_schema_version() as current_version,
  COUNT(*) as total_artworks
FROM artworks;
