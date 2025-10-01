-- Migration: Add Edit Request Support
-- Created: 2025-01-30
-- Purpose: Allow customers to request edits with 2-request limit

-- Add edit_request_text column to admin_reviews
ALTER TABLE admin_reviews 
ADD COLUMN IF NOT EXISTS edit_request_text TEXT;

-- Update review_type constraint to include 'edit_request'
ALTER TABLE admin_reviews 
DROP CONSTRAINT IF EXISTS admin_reviews_review_type_check;

ALTER TABLE admin_reviews 
ADD CONSTRAINT admin_reviews_review_type_check 
CHECK (review_type IN ('artwork_proof', 'highres_file', 'edit_request'));

-- Add edit_request_count to artworks table to track request limits
ALTER TABLE artworks 
ADD COLUMN IF NOT EXISTS edit_request_count INTEGER DEFAULT 0;

-- Create index for efficient edit request queries
CREATE INDEX IF NOT EXISTS idx_admin_reviews_edit_requests 
ON admin_reviews(artwork_id, review_type) 
WHERE review_type = 'edit_request';

-- Add comments for documentation
COMMENT ON COLUMN admin_reviews.edit_request_text IS 'Customer''s edit request description (for edit_request review type)';
COMMENT ON COLUMN artworks.edit_request_count IS 'Number of edit requests submitted by customer (max 2)';

-- Drop existing function to allow changing return type
DROP FUNCTION IF EXISTS get_pending_reviews(TEXT);

-- Recreate get_pending_reviews function to include edit requests
CREATE OR REPLACE FUNCTION get_pending_reviews(p_review_type TEXT DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    review_id UUID,
    artwork_id UUID,
    review_type VARCHAR(50),
    status VARCHAR(20),
    image_url TEXT,
    fal_generation_url TEXT,
    customer_name TEXT,
    customer_email TEXT,
    pet_name TEXT,
    review_notes TEXT,
    reviewed_by TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    artwork_token TEXT,
    edit_request_text TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ar.id,
        ar.id as review_id,
        ar.artwork_id,
        ar.review_type,
        ar.status,
        ar.image_url,
        ar.fal_generation_url,
        ar.customer_name,
        ar.customer_email,
        ar.pet_name,
        ar.review_notes,
        ar.reviewed_by,
        ar.reviewed_at,
        ar.created_at,
        a.access_token as artwork_token,
        ar.edit_request_text
    FROM admin_reviews ar
    JOIN artworks a ON ar.artwork_id = a.id
    WHERE ar.status = 'pending'
    AND (p_review_type IS NULL OR ar.review_type = p_review_type)
    ORDER BY ar.created_at ASC;
END;
$$ LANGUAGE plpgsql;
