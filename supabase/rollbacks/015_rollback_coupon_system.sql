-- Rollback: Remove Coupon System
-- Description: Remove coupon codes tables and functions
-- Date: 2025-01-25

-- Drop functions
DROP FUNCTION IF EXISTS apply_coupon_code;
DROP FUNCTION IF EXISTS validate_coupon_code;

-- Drop tables (cascade will handle foreign key constraints)
DROP TABLE IF EXISTS coupon_usage CASCADE;
DROP TABLE IF EXISTS coupon_codes CASCADE;

COMMENT ON SCHEMA public IS 'Rolled back coupon system migration 015';
