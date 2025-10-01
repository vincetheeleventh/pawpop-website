-- Run this in Supabase Dashboard SQL Editor
-- Migration 023: Add regeneration history tracking

-- Add regeneration_history JSONB column to admin_reviews
ALTER TABLE admin_reviews 
ADD COLUMN IF NOT EXISTS regeneration_history JSONB DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN admin_reviews.regeneration_history IS 'History of regeneration attempts with timestamps, images, and prompt tweaks. Structure: [{timestamp, image_url, monalisa_base_url, prompt_tweak, regenerated_monalisa}]';

-- Add index for faster queries on regeneration history
CREATE INDEX IF NOT EXISTS idx_admin_reviews_regeneration_history 
ON admin_reviews USING GIN (regeneration_history);

-- Verify the column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'admin_reviews' 
AND column_name = 'regeneration_history';
