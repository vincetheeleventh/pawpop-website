-- Rollback: 001_rollback_initial_schema
-- Description: Revert initial PawPop schema setup

BEGIN;

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS artworks CASCADE;

-- Drop helper functions
DROP FUNCTION IF EXISTS validate_migration(INTEGER);
DROP FUNCTION IF EXISTS get_schema_version();
DROP FUNCTION IF EXISTS exec_sql(TEXT);

-- Drop schema_version table (this will remove all version tracking)
DROP TABLE IF EXISTS schema_version CASCADE;

COMMIT;
