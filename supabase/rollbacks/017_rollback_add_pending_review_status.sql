-- Rollback: 017_add_pending_review_status
-- Description: Remove 'pending_review' status from orders table
-- Author: manual_approval_system
-- Date: 2025-09-27

BEGIN;

-- First, update any orders with pending_review status to processing
UPDATE orders SET order_status = 'processing' WHERE order_status = 'pending_review';

-- Remove pending_review status from the orders table CHECK constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_order_status_check;

ALTER TABLE orders ADD CONSTRAINT orders_order_status_check 
CHECK (order_status IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'));

-- Remove schema version entry
DELETE FROM schema_version WHERE version = 17;

COMMIT;
