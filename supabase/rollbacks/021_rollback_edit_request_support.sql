-- Rollback: Remove Edit Request Support
-- Created: 2025-01-30

-- Remove edit_request_count from artworks
ALTER TABLE artworks 
DROP COLUMN IF EXISTS edit_request_count;

-- Remove edit_request_text from admin_reviews
ALTER TABLE admin_reviews 
DROP COLUMN IF EXISTS edit_request_text;

-- Restore original review_type constraint
ALTER TABLE admin_reviews 
DROP CONSTRAINT IF EXISTS admin_reviews_review_type_check;

ALTER TABLE admin_reviews 
ADD CONSTRAINT admin_reviews_review_type_check 
CHECK (review_type IN ('artwork_proof', 'highres_file'));

-- Drop index
DROP INDEX IF EXISTS idx_admin_reviews_edit_requests;

-- Restore original get_pending_reviews function
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
    artwork_token TEXT
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
        a.access_token as artwork_token
    FROM admin_reviews ar
    JOIN artworks a ON ar.artwork_id = a.id
    WHERE ar.status = 'pending'
    AND (p_review_type IS NULL OR ar.review_type = p_review_type)
    ORDER BY ar.created_at ASC;
END;
$$ LANGUAGE plpgsql;
