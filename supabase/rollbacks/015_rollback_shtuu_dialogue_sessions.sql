-- Rollback: 015_shtuu_dialogue_sessions
-- Description: Rollback dialogue_sessions table creation

-- Drop indexes from artworks
DROP INDEX IF EXISTS idx_artworks_dialogue_session;
DROP INDEX IF EXISTS idx_artworks_parody_style;

-- Drop columns from artworks
ALTER TABLE artworks DROP COLUMN IF EXISTS dialogue_session_id;
ALTER TABLE artworks DROP COLUMN IF EXISTS parody_style;

-- Drop trigger
DROP TRIGGER IF EXISTS dialogue_sessions_updated_at ON dialogue_sessions;
DROP FUNCTION IF EXISTS update_dialogue_session_updated_at();

-- Drop indexes
DROP INDEX IF EXISTS idx_dialogue_sessions_current_step;
DROP INDEX IF EXISTS idx_dialogue_sessions_last_interaction;
DROP INDEX IF EXISTS idx_dialogue_sessions_user_id;
DROP INDEX IF EXISTS idx_dialogue_sessions_token;

-- Drop table
DROP TABLE IF EXISTS dialogue_sessions;
