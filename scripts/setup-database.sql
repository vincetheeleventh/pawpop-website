-- ============================================
-- PawPop Database Migration System Setup
-- Run this ONCE in Supabase SQL Editor
-- ============================================

-- Create schema_version table for tracking migrations
CREATE TABLE IF NOT EXISTS schema_version (
  id SERIAL PRIMARY KEY,
  version INTEGER NOT NULL,
  description TEXT NOT NULL,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  applied_by TEXT DEFAULT 'system',
  rollback_available BOOLEAN DEFAULT true
);

-- Create exec_sql function for migration system
CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result TEXT;
BEGIN
    -- Execute the SQL
    EXECUTE sql_query;
    
    -- Return success message
    result := 'SQL executed successfully';
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Re-raise the exception with context
        RAISE EXCEPTION 'SQL execution failed: %', SQLERRM;
END;
$$;

-- Helper functions for schema management
CREATE OR REPLACE FUNCTION get_schema_version()
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE((SELECT version FROM schema_version ORDER BY applied_at DESC LIMIT 1), 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- Insert initial version if table is empty
INSERT INTO schema_version (version, description, applied_by)
SELECT 0, 'Migration system initialized', 'setup_script'
WHERE NOT EXISTS (SELECT 1 FROM schema_version);

-- Verify setup
SELECT 
  'Setup completed successfully!' as status,
  get_schema_version() as current_version,
  COUNT(*) as total_versions
FROM schema_version;
