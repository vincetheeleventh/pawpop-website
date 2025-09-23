-- Rollback: Finalize Admin Review System
-- This rollback removes the optimizations and final touches added in migration 004

-- Drop the monitoring view
DROP VIEW IF EXISTS admin_review_summary;

-- Remove comments
COMMENT ON TABLE admin_reviews IS NULL;
COMMENT ON COLUMN admin_reviews.review_type IS NULL;
COMMENT ON COLUMN admin_reviews.status IS NULL;
COMMENT ON COLUMN admin_reviews.fal_generation_url IS NULL;
COMMENT ON COLUMN artworks.review_status IS NULL;

-- Drop the statistics function
DROP FUNCTION IF EXISTS get_review_statistics();

-- Drop the trigger and function for updated_at
DROP TRIGGER IF EXISTS trigger_update_admin_reviews_updated_at ON admin_reviews;
DROP FUNCTION IF EXISTS update_admin_reviews_updated_at();

-- Drop the additional RLS policy
DROP POLICY IF EXISTS "Service role can manage all reviews" ON admin_reviews;

-- Drop the performance indexes
DROP INDEX IF EXISTS idx_admin_reviews_status_type;
DROP INDEX IF EXISTS idx_admin_reviews_artwork_id;
DROP INDEX IF EXISTS idx_admin_reviews_created_at;
DROP INDEX IF EXISTS idx_artworks_review_status;

-- Note: We don't revert the review_status column updates as that could cause data loss
-- The column values will remain but without the indexes and optimizations
