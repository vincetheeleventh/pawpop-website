-- Schema Version Tracking Table
-- This table tracks the current database schema version and migration history

CREATE TABLE IF NOT EXISTS schema_version (
  id SERIAL PRIMARY KEY,
  version INTEGER NOT NULL,
  description TEXT NOT NULL,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  applied_by TEXT DEFAULT 'system',
  rollback_available BOOLEAN DEFAULT true
);

-- Insert initial version if table is empty
INSERT INTO schema_version (version, description, applied_by)
SELECT 1, 'Initial PawPop schema', 'migration_system'
WHERE NOT EXISTS (SELECT 1 FROM schema_version);

-- Function to get current schema version
CREATE OR REPLACE FUNCTION get_schema_version()
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT version FROM schema_version ORDER BY applied_at DESC LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate migration prerequisites
CREATE OR REPLACE FUNCTION validate_migration(required_version INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
  IF get_schema_version() != required_version THEN
    RAISE EXCEPTION 'Migration requires version %, current version: %', 
      required_version, get_schema_version();
  END IF;
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
