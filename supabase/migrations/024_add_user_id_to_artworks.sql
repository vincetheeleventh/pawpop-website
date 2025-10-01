-- Migration: 024_add_user_id_to_artworks
-- Description: Add user_id foreign key to artworks table for user tracking
-- Date: 2025-10-01

BEGIN;

-- Add user_id column to artworks table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'artworks' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE artworks ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_artworks_user_id ON artworks(user_id);
    COMMENT ON COLUMN artworks.user_id IS 'Foreign key to auth.users for authenticated/tracked users';
  END IF;
END $$;

-- Create or replace function to create user and link to artwork
CREATE OR REPLACE FUNCTION create_or_get_user_by_email(
  p_email TEXT,
  p_customer_name TEXT DEFAULT ''
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Try to find existing user by email in auth.users
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email
  LIMIT 1;
  
  -- If user doesn't exist, create a passwordless user
  IF v_user_id IS NULL THEN
    -- Insert into auth.users (requires service role)
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      p_email,
      crypt('', gen_salt('bf')), -- Passwordless - empty password
      NOW(), -- Auto-confirm email
      jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
      jsonb_build_object('customer_name', p_customer_name),
      NOW(),
      NOW(),
      '',
      ''
    )
    RETURNING id INTO v_user_id;
  END IF;
  
  RETURN v_user_id;
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION create_or_get_user_by_email(TEXT, TEXT) TO service_role;

-- Record migration
INSERT INTO schema_version (version, description, applied_by)
VALUES (24, 'Add user_id to artworks and user creation function', 'system');

COMMIT;
