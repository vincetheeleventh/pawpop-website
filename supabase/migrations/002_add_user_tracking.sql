-- Migration: 002_add_user_tracking
-- Description: Add user tracking and analytics fields to artworks
-- Author: migration_system
-- Date: 2025-01-08

-- Validate prerequisites
SELECT validate_migration(1);

BEGIN;

-- Add user tracking fields to artworks table
ALTER TABLE artworks ADD COLUMN user_agent TEXT;
ALTER TABLE artworks ADD COLUMN ip_address INET;
ALTER TABLE artworks ADD COLUMN referrer TEXT;
ALTER TABLE artworks ADD COLUMN utm_source TEXT;
ALTER TABLE artworks ADD COLUMN utm_medium TEXT;
ALTER TABLE artworks ADD COLUMN utm_campaign TEXT;

-- Add analytics tracking
ALTER TABLE artworks ADD COLUMN conversion_funnel JSONB DEFAULT '{}';
ALTER TABLE artworks ADD COLUMN last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for analytics queries
CREATE INDEX idx_artworks_utm_source ON artworks(utm_source);
CREATE INDEX idx_artworks_last_activity ON artworks(last_activity_at);

-- Update schema version
UPDATE schema_version SET 
  version = 2, 
  applied_at = NOW(),
  description = 'Add user tracking and analytics fields';

COMMIT;
