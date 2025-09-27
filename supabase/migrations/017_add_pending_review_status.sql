-- Migration: 017_add_pending_review_status
-- Description: Add 'pending_review' status to orders table for manual approval workflow
-- Author: manual_approval_system
-- Date: 2025-09-27

BEGIN;

-- Add pending_review status to the orders table CHECK constraint
-- First drop the existing constraint
ALTER TABLE orders DROP CONSTRAINT orders_order_status_check;

-- Add the new constraint with pending_review included
ALTER TABLE orders ADD CONSTRAINT orders_order_status_check 
CHECK (order_status IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'pending_review'));

-- Update schema version
INSERT INTO schema_version (version, description, applied_by)
VALUES (17, 'Add pending_review status to orders table for manual approval workflow', 'manual_approval_system');

COMMIT;
