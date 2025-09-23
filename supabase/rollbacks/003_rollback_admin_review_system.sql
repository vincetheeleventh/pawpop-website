-- Rollback: Remove Admin Review System
-- This rollback script removes all admin review system components

-- Drop triggers
DROP TRIGGER IF EXISTS trigger_admin_reviews_updated_at ON admin_reviews;

-- Drop functions
DROP FUNCTION IF EXISTS update_admin_reviews_updated_at();
DROP FUNCTION IF EXISTS process_admin_review(UUID, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS get_pending_reviews(TEXT);
DROP FUNCTION IF EXISTS update_artwork_review_status(UUID, TEXT, TEXT);

-- Drop indexes
DROP INDEX IF EXISTS idx_artworks_review_status;
DROP INDEX IF EXISTS idx_admin_reviews_status_type;
DROP INDEX IF EXISTS idx_admin_reviews_created_at;
DROP INDEX IF EXISTS idx_admin_reviews_type;
DROP INDEX IF EXISTS idx_admin_reviews_status;
DROP INDEX IF EXISTS idx_admin_reviews_artwork_id;

-- Remove column from artworks table
ALTER TABLE artworks DROP COLUMN IF EXISTS review_status;

-- Drop table
DROP TABLE IF EXISTS admin_reviews;
