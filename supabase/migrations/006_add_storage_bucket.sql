-- Migration: Add Supabase Storage bucket for artwork images
-- Created: 2025-01-16
-- Purpose: Create storage bucket for 30-day image retention

-- Create storage bucket for artwork images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'artwork-images',
  'artwork-images', 
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
);

-- Create RLS policy for public read access
CREATE POLICY "Public read access for artwork images" ON storage.objects
FOR SELECT USING (bucket_id = 'artwork-images');

-- Create RLS policy for service role write access
CREATE POLICY "Service role can upload artwork images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'artwork-images' AND 
  auth.role() = 'service_role'
);

-- Create RLS policy for service role update access
CREATE POLICY "Service role can update artwork images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'artwork-images' AND 
  auth.role() = 'service_role'
);

-- Create RLS policy for service role delete access
CREATE POLICY "Service role can delete artwork images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'artwork-images' AND 
  auth.role() = 'service_role'
);
