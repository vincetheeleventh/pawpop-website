-- Add column to track manual image replacements by admin
ALTER TABLE admin_reviews 
ADD COLUMN manually_replaced BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN admin_reviews.manually_replaced IS 'Tracks whether the admin manually replaced the generated image';

-- Create index for efficient queries on manually replaced reviews
CREATE INDEX idx_admin_reviews_manually_replaced ON admin_reviews(manually_replaced) WHERE manually_replaced = TRUE;
