-- Migration: Finalize Admin Review System
-- This migration ensures the admin review system is fully operational
-- and adds any final optimizations and indexes for production use.

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_admin_reviews_status_type 
ON admin_reviews (status, review_type);

CREATE INDEX IF NOT EXISTS idx_admin_reviews_artwork_id 
ON admin_reviews (artwork_id);

CREATE INDEX IF NOT EXISTS idx_admin_reviews_created_at 
ON admin_reviews (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_artworks_review_status 
ON artworks USING gin (review_status);

-- Add a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_admin_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_admin_reviews_updated_at ON admin_reviews;
CREATE TRIGGER trigger_update_admin_reviews_updated_at
    BEFORE UPDATE ON admin_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_admin_reviews_updated_at();

-- Add a function to get review statistics for monitoring
CREATE OR REPLACE FUNCTION get_review_statistics()
RETURNS TABLE (
    total_reviews BIGINT,
    pending_reviews BIGINT,
    approved_reviews BIGINT,
    rejected_reviews BIGINT,
    artwork_proof_reviews BIGINT,
    highres_file_reviews BIGINT,
    avg_review_time_hours NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_reviews,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_reviews,
        COUNT(*) FILTER (WHERE status = 'approved') as approved_reviews,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected_reviews,
        COUNT(*) FILTER (WHERE review_type = 'artwork_proof') as artwork_proof_reviews,
        COUNT(*) FILTER (WHERE review_type = 'highres_file') as highres_file_reviews,
        COALESCE(
            AVG(EXTRACT(EPOCH FROM (reviewed_at - created_at)) / 3600) 
            FILTER (WHERE reviewed_at IS NOT NULL), 
            0
        ) as avg_review_time_hours
    FROM admin_reviews;
END;
$$ LANGUAGE plpgsql;

-- Add RLS policy for service role access (if not already exists)
DO $$
BEGIN
    -- Check if policy exists before creating
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'admin_reviews' 
        AND policyname = 'Service role can manage all reviews'
    ) THEN
        CREATE POLICY "Service role can manage all reviews" ON admin_reviews
        FOR ALL USING (true);
    END IF;
END $$;

-- Ensure the review_status column has proper default values for existing artworks
UPDATE artworks 
SET review_status = '{"artwork_proof": "not_required", "highres_file": "not_required"}'::jsonb
WHERE review_status IS NULL;

-- Add a comment to document the admin review system
COMMENT ON TABLE admin_reviews IS 'Stores human-in-the-loop review requests for artwork quality control';
COMMENT ON COLUMN admin_reviews.review_type IS 'Type of review: artwork_proof (after generation) or highres_file (after upscaling)';
COMMENT ON COLUMN admin_reviews.status IS 'Review status: pending, approved, or rejected';
COMMENT ON COLUMN admin_reviews.fal_generation_url IS 'URL to the original fal.ai generation for reference';
COMMENT ON COLUMN artworks.review_status IS 'JSONB tracking review status for both artwork_proof and highres_file stages';

-- Create a view for easy review monitoring
CREATE OR REPLACE VIEW admin_review_summary AS
SELECT 
    ar.id,
    ar.review_type,
    ar.status,
    ar.customer_name,
    ar.customer_email,
    ar.pet_name,
    ar.created_at,
    ar.reviewed_at,
    ar.reviewed_by,
    a.access_token as artwork_token,
    CASE 
        WHEN ar.reviewed_at IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (ar.reviewed_at - ar.created_at)) / 3600 
        ELSE NULL 
    END as review_time_hours
FROM admin_reviews ar
JOIN artworks a ON ar.artwork_id = a.id
ORDER BY ar.created_at DESC;

COMMENT ON VIEW admin_review_summary IS 'Convenient view for monitoring admin reviews with calculated metrics';
