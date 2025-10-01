-- Rollback: Remove price_variant column from artworks table
-- Description: Reverts the addition of the price_variant column for A/B testing
-- Created: 2025-01-30

-- Drop index
DROP INDEX IF EXISTS idx_artworks_price_variant;

-- Drop column
ALTER TABLE artworks 
DROP COLUMN IF EXISTS price_variant;
