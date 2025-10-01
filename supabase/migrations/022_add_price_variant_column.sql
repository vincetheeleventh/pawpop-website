-- Migration: Add price_variant column to artworks table for cross-device pricing consistency
-- Description: Stores the A/B test variant assigned to each user so pricing is consistent across devices
-- Created: 2025-01-30

-- Add price_variant column with constraint
ALTER TABLE artworks 
ADD COLUMN price_variant TEXT CHECK (price_variant IN ('A', 'B'));

-- Set default value for existing rows (variant A)
UPDATE artworks 
SET price_variant = 'A' 
WHERE price_variant IS NULL;

-- Add index for faster queries
CREATE INDEX idx_artworks_price_variant ON artworks(price_variant);

-- Add comment for documentation
COMMENT ON COLUMN artworks.price_variant IS 'A/B test variant assigned to user for consistent pricing across devices. A = Standard ($15/$39-$149), B = Premium ($45/$79-$225)';
