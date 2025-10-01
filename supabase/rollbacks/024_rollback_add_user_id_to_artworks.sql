-- Rollback: 024_add_user_id_to_artworks
-- Description: Remove user_id column and user creation function
-- Date: 2025-10-01

BEGIN;

-- Drop the function
DROP FUNCTION IF EXISTS create_or_get_user_by_email(TEXT, TEXT);

-- Drop the index
DROP INDEX IF EXISTS idx_artworks_user_id;

-- Drop the column
ALTER TABLE artworks DROP COLUMN IF EXISTS user_id;

-- Remove migration record
DELETE FROM schema_version WHERE version = 24;

COMMIT;
