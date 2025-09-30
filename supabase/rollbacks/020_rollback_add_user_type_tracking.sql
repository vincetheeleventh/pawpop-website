-- Rollback: Remove user_type tracking
-- Created: 2025-09-30
-- Description: Removes user_type column and related analytics view

-- Drop the analytics view
DROP VIEW IF EXISTS user_type_analytics;

-- Drop the index
DROP INDEX IF EXISTS idx_artworks_user_type;

-- Remove the column
ALTER TABLE artworks 
DROP COLUMN IF EXISTS user_type;
