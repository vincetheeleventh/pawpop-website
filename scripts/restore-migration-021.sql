-- Restore migration 021 schema_version record
-- This was accidentally deleted

INSERT INTO schema_version (version, description, applied_by, applied_at)
VALUES (
  21, 
  'Add Edit Request Support - Allow customers to request edits with 2-request limit',
  'manual_restore',
  '2025-01-30 00:00:00+00'
);

-- Verify it's there
SELECT version, description, applied_at 
FROM schema_version 
WHERE version = 21;
