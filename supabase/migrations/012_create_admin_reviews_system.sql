-- Migration: Create Admin Reviews System for Manual Approval Process
-- Created: 2025-01-22
-- Purpose: Add admin_reviews table and functions for human-in-the-loop quality control

-- Create admin_reviews table
CREATE TABLE IF NOT EXISTS admin_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    artwork_id UUID NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
    review_type VARCHAR(50) NOT NULL CHECK (review_type IN ('artwork_proof', 'highres_file')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    
    -- Review content
    image_url TEXT NOT NULL,
    fal_generation_url TEXT,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    pet_name TEXT,
    
    -- Review metadata
    review_notes TEXT,
    reviewed_by TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_reviews_artwork_id ON admin_reviews(artwork_id);
CREATE INDEX IF NOT EXISTS idx_admin_reviews_status ON admin_reviews(status);
CREATE INDEX IF NOT EXISTS idx_admin_reviews_review_type ON admin_reviews(review_type);
CREATE INDEX IF NOT EXISTS idx_admin_reviews_created_at ON admin_reviews(created_at);

-- Add review_status column to artworks table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='artworks' AND column_name='review_status') THEN
        ALTER TABLE artworks ADD COLUMN review_status JSONB DEFAULT '{}';
    END IF;
END $$;

-- Create function to update artwork review status
CREATE OR REPLACE FUNCTION update_artwork_review_status(
    p_artwork_id UUID,
    p_review_type TEXT,
    p_status TEXT
) RETURNS VOID AS $$
BEGIN
    UPDATE artworks 
    SET 
        review_status = COALESCE(review_status, '{}'::jsonb) || 
                       jsonb_build_object(p_review_type, jsonb_build_object(
                           'status', p_status,
                           'updated_at', NOW()
                       )),
        updated_at = NOW()
    WHERE id = p_artwork_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to get pending reviews
CREATE OR REPLACE FUNCTION get_pending_reviews(p_review_type TEXT DEFAULT NULL)
RETURNS TABLE (
    review_id UUID,
    artwork_id UUID,
    review_type TEXT,
    status TEXT,
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
        ar.id as review_id,
        ar.artwork_id,
        ar.review_type::TEXT,
        ar.status::TEXT,
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
    WHERE (p_review_type IS NULL OR ar.review_type = p_review_type)
    ORDER BY ar.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Create function to approve/reject review
CREATE OR REPLACE FUNCTION process_admin_review(
    p_review_id UUID,
    p_status TEXT,
    p_reviewed_by TEXT,
    p_notes TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_artwork_id UUID;
    v_review_type TEXT;
BEGIN
    -- Validate status
    IF p_status NOT IN ('approved', 'rejected') THEN
        RAISE EXCEPTION 'Invalid status. Must be approved or rejected.';
    END IF;
    
    -- Update the review
    UPDATE admin_reviews 
    SET 
        status = p_status,
        reviewed_by = p_reviewed_by,
        reviewed_at = NOW(),
        review_notes = p_notes,
        updated_at = NOW()
    WHERE id = p_review_id
    RETURNING artwork_id, review_type INTO v_artwork_id, v_review_type;
    
    -- Check if review was found
    IF v_artwork_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Update artwork review status
    PERFORM update_artwork_review_status(v_artwork_id, v_review_type, p_status);
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_admin_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_admin_reviews_updated_at ON admin_reviews;
CREATE TRIGGER trigger_admin_reviews_updated_at
    BEFORE UPDATE ON admin_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_admin_reviews_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE admin_reviews ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow service role full access)
DROP POLICY IF EXISTS "Service role can manage admin_reviews" ON admin_reviews;
CREATE POLICY "Service role can manage admin_reviews" ON admin_reviews
    FOR ALL USING (auth.role() = 'service_role');

-- Add comments for documentation
COMMENT ON TABLE admin_reviews IS 'Human-in-the-loop quality control reviews for artwork and high-res files';
COMMENT ON COLUMN admin_reviews.review_type IS 'Type of review: artwork_proof (after generation) or highres_file (after upscaling)';
COMMENT ON COLUMN admin_reviews.fal_generation_url IS 'Original fal.ai generation URL for admin reference';
COMMENT ON FUNCTION get_pending_reviews IS 'Get all reviews for admin dashboard';
COMMENT ON FUNCTION process_admin_review IS 'Approve or reject a review and update artwork status';
