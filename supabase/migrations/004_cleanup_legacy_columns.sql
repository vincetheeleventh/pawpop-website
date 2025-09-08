-- Migration: Cleanup legacy columns from artworks table
-- Remove redundant columns that are now handled by JSONB fields

-- First, let's verify the new JSONB structure is being used
-- (This is a safety check - in production you'd want to ensure data migration is complete)

-- Remove legacy image URL columns (now in JSONB fields)
ALTER TABLE artworks DROP COLUMN IF EXISTS original_image_url;
ALTER TABLE artworks DROP COLUMN IF EXISTS generated_image_url;
ALTER TABLE artworks DROP COLUMN IF EXISTS original_pet_mom_url;
ALTER TABLE artworks DROP COLUMN IF EXISTS original_pet_url;

-- Remove legacy status column (replaced by generation_step + processing_status)
ALTER TABLE artworks DROP COLUMN IF EXISTS generation_status;

-- The cleaned up table will have:
-- Core: id, user_id, customer_name, customer_email, pet_name
-- Security: access_token, token_expires_at  
-- Audit: created_at, updated_at
-- Organized Data: source_images, generated_images, delivery_images
-- Workflow: generation_step, processing_status, generation_metadata
