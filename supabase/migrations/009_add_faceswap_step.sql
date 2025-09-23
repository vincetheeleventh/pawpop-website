-- Migration: Add FaceSwap Step to Artwork Generation Pipeline
-- Description: Adds faceswap_result field to generated_images JSONB and updates generation_step enum
-- Date: 2025-01-22
-- Version: 009

-- Update the generation_step enum to include 'faceswap'
ALTER TYPE generation_step_enum ADD VALUE 'faceswap' AFTER 'monalisa_generation';

-- Add comment explaining the new faceswap step
COMMENT ON TYPE generation_step_enum IS 'Artwork generation workflow steps: pending -> monalisa_generation -> faceswap -> pet_integration -> upscaling -> mockup_generation -> completed/failed';

-- Update the generated_images JSONB structure documentation
COMMENT ON COLUMN artworks.generated_images IS 'JSONB structure: {
  "monalisa_base": "url_to_monalisa_portrait",
  "faceswap_result": "url_to_faceswapped_portrait", 
  "artwork_preview": "url_to_preview_image",
  "artwork_full_res": "url_to_full_resolution_image",
  "generation_steps": []
}';

-- Create index for faceswap step filtering (for monitoring and debugging)
CREATE INDEX IF NOT EXISTS idx_artworks_faceswap_step 
ON artworks (generation_step) 
WHERE generation_step = 'faceswap';

-- Add function to get artworks needing faceswap processing
CREATE OR REPLACE FUNCTION get_artworks_needing_faceswap()
RETURNS TABLE (
  id uuid,
  customer_email text,
  customer_name text,
  source_images jsonb,
  generated_images jsonb,
  created_at timestamptz
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    a.id,
    a.customer_email,
    a.customer_name,
    a.source_images,
    a.generated_images,
    a.created_at
  FROM artworks a
  WHERE a.generation_step = 'faceswap'
    AND a.generated_images->>'monalisa_base' IS NOT NULL
    AND (a.generated_images->>'faceswap_result' IS NULL OR a.generated_images->>'faceswap_result' = '')
  ORDER BY a.created_at ASC;
$$;

-- Add function to update faceswap result
CREATE OR REPLACE FUNCTION update_artwork_faceswap_result(
  artwork_id uuid,
  faceswap_url text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE artworks 
  SET 
    generated_images = jsonb_set(
      COALESCE(generated_images, '{}'::jsonb),
      '{faceswap_result}',
      to_jsonb(faceswap_url)
    ),
    updated_at = now()
  WHERE id = artwork_id;
  
  RETURN FOUND;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_artworks_needing_faceswap() TO authenticated;
GRANT EXECUTE ON FUNCTION get_artworks_needing_faceswap() TO service_role;
GRANT EXECUTE ON FUNCTION update_artwork_faceswap_result(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION update_artwork_faceswap_result(uuid, text) TO service_role;

-- Update schema version
INSERT INTO schema_migrations (version, description, applied_at) 
VALUES ('009', 'Add FaceSwap Step to Artwork Generation Pipeline', now())
ON CONFLICT (version) DO UPDATE SET 
  description = EXCLUDED.description,
  applied_at = EXCLUDED.applied_at;
