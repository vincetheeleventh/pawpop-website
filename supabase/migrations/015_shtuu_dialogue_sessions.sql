-- Migration: 015_shtuu_dialogue_sessions
-- Description: Create dialogue_sessions table for Shtuu's interactive questionnaire
-- Created: October 27, 2025

-- Create dialogue_sessions table
CREATE TABLE IF NOT EXISTS dialogue_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_token TEXT UNIQUE NOT NULL,
  current_step TEXT NOT NULL DEFAULT 'welcome',
  conversation_state JSONB DEFAULT '{}',
  artwork_id UUID REFERENCES artworks(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_interaction_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  session_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_dialogue_sessions_token ON dialogue_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_dialogue_sessions_user_id ON dialogue_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_dialogue_sessions_last_interaction ON dialogue_sessions(last_interaction_at DESC);
CREATE INDEX IF NOT EXISTS idx_dialogue_sessions_current_step ON dialogue_sessions(current_step);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_dialogue_session_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER dialogue_sessions_updated_at
  BEFORE UPDATE ON dialogue_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_dialogue_session_updated_at();

-- Add parody_style column to artworks table
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS parody_style TEXT;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS dialogue_session_id UUID REFERENCES dialogue_sessions(id) ON DELETE SET NULL;

-- Create index for parody_style queries
CREATE INDEX IF NOT EXISTS idx_artworks_parody_style ON artworks(parody_style);
CREATE INDEX IF NOT EXISTS idx_artworks_dialogue_session ON artworks(dialogue_session_id);

-- Comments for documentation
COMMENT ON TABLE dialogue_sessions IS 'Stores Shtuu dialogue conversation state and progress';
COMMENT ON COLUMN dialogue_sessions.session_token IS 'Unique token for anonymous session tracking';
COMMENT ON COLUMN dialogue_sessions.current_step IS 'Current dialogue step: welcome, pet_type, upload, generating, reveal, feedback';
COMMENT ON COLUMN dialogue_sessions.conversation_state IS 'JSONB store for user responses, pet type, etc.';
