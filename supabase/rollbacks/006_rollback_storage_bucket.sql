-- Rollback: Remove Supabase Storage bucket for artwork images
-- Created: 2025-01-16
-- Purpose: Rollback storage bucket creation

-- Drop RLS policies
DROP POLICY IF EXISTS "Public read access for artwork images" ON storage.objects;
DROP POLICY IF EXISTS "Service role can upload artwork images" ON storage.objects;
DROP POLICY IF EXISTS "Service role can update artwork images" ON storage.objects;
DROP POLICY IF EXISTS "Service role can delete artwork images" ON storage.objects;

-- Remove storage bucket (this will also delete all files in the bucket)
DELETE FROM storage.buckets WHERE id = 'artwork-images';
