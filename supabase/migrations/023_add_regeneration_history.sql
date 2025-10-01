-- Migration: Add regeneration history tracking to admin_reviews
-- Description: Stores history of artwork regeneration attempts with prompt tweaks
-- Created: 2025-01-30

-- Add regeneration_history JSONB column to admin_reviews
ALTER TABLE admin_reviews 
ADD COLUMN IF NOT EXISTS regeneration_history JSONB DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN admin_reviews.regeneration_history IS 'History of regeneration attempts with timestamps, images, and prompt tweaks. Structure: [{timestamp, image_url, monalisa_base_url, prompt_tweak, regenerated_monalisa}]';

-- Add index for faster queries on regeneration history
CREATE INDEX IF NOT EXISTS idx_admin_reviews_regeneration_history 
ON admin_reviews USING GIN (regeneration_history);

-- Example structure for regeneration_history:
-- [
--   {
--     "timestamp": "2025-01-30T12:00:00Z",
--     "image_url": "https://...",
--     "monalisa_base_url": "https://...",
--     "prompt_tweak": "make pet smaller",
--     "regenerated_monalisa": true,
--     "fal_generation_url": "https://..."
--   }
-- ]
