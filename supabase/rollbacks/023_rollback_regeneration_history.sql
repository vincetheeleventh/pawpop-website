-- Rollback: Remove regeneration history tracking
-- Description: Removes regeneration_history column and related objects
-- Created: 2025-01-30

-- Drop index
DROP INDEX IF EXISTS idx_admin_reviews_regeneration_history;

-- Remove column
ALTER TABLE admin_reviews 
DROP COLUMN IF EXISTS regeneration_history;
