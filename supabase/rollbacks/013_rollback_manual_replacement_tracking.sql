-- Rollback manual replacement tracking
DROP INDEX IF EXISTS idx_admin_reviews_manually_replaced;
ALTER TABLE admin_reviews DROP COLUMN IF EXISTS manually_replaced;
