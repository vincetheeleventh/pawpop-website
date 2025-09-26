-- Migration: Add Coupon System
-- Description: Create coupon codes table with validation and usage tracking
-- Date: 2025-01-25

-- Create coupon_codes table
CREATE TABLE IF NOT EXISTS coupon_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    
    -- Discount configuration
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
    discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value > 0),
    
    -- Usage limits
    usage_limit INTEGER, -- NULL = unlimited
    usage_count INTEGER DEFAULT 0 NOT NULL,
    
    -- Validity period
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE,
    
    -- Product restrictions
    applicable_products JSONB DEFAULT '[]'::jsonb, -- Empty array = all products
    minimum_order_amount DECIMAL(10,2) DEFAULT 0,
    
    -- Status and metadata
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255),
    
    -- Indexes
    CONSTRAINT valid_discount_value CHECK (
        (discount_type = 'percentage' AND discount_value <= 100) OR
        (discount_type = 'fixed_amount' AND discount_value > 0)
    )
);

-- Create coupon_usage table for tracking individual uses
CREATE TABLE IF NOT EXISTS coupon_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    coupon_id UUID NOT NULL REFERENCES coupon_codes(id) ON DELETE CASCADE,
    order_id VARCHAR(255), -- Stripe session ID or order reference
    artwork_id UUID REFERENCES artworks(id),
    
    -- Usage details
    original_amount DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) NOT NULL,
    final_amount DECIMAL(10,2) NOT NULL,
    
    -- Metadata
    user_email VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate usage per order
    UNIQUE(coupon_id, order_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_coupon_codes_code ON coupon_codes(code);
CREATE INDEX IF NOT EXISTS idx_coupon_codes_active ON coupon_codes(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_coupon_codes_validity ON coupon_codes(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon_id ON coupon_usage(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_order_id ON coupon_usage(order_id);

-- Create function to validate coupon
CREATE OR REPLACE FUNCTION validate_coupon_code(
    p_code VARCHAR(50),
    p_order_amount DECIMAL(10,2) DEFAULT 0,
    p_product_type VARCHAR(50) DEFAULT NULL
)
RETURNS TABLE(
    is_valid BOOLEAN,
    coupon_id UUID,
    discount_type VARCHAR(20),
    discount_value DECIMAL(10,2),
    discount_amount DECIMAL(10,2),
    final_amount DECIMAL(10,2),
    error_message TEXT
) AS $$
DECLARE
    v_coupon coupon_codes%ROWTYPE;
    v_discount_amount DECIMAL(10,2);
    v_final_amount DECIMAL(10,2);
BEGIN
    -- Find the coupon
    SELECT * INTO v_coupon
    FROM coupon_codes
    WHERE code = p_code AND is_active = true;
    
    -- Check if coupon exists
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, NULL::UUID, NULL::VARCHAR(20), NULL::DECIMAL(10,2), 
                           NULL::DECIMAL(10,2), p_order_amount, 'Invalid coupon code';
        RETURN;
    END IF;
    
    -- Check validity period
    IF v_coupon.valid_from > NOW() THEN
        RETURN QUERY SELECT false, v_coupon.id, v_coupon.discount_type, v_coupon.discount_value,
                           NULL::DECIMAL(10,2), p_order_amount, 'Coupon is not yet valid';
        RETURN;
    END IF;
    
    IF v_coupon.valid_until IS NOT NULL AND v_coupon.valid_until < NOW() THEN
        RETURN QUERY SELECT false, v_coupon.id, v_coupon.discount_type, v_coupon.discount_value,
                           NULL::DECIMAL(10,2), p_order_amount, 'Coupon has expired';
        RETURN;
    END IF;
    
    -- Check usage limit
    IF v_coupon.usage_limit IS NOT NULL AND v_coupon.usage_count >= v_coupon.usage_limit THEN
        RETURN QUERY SELECT false, v_coupon.id, v_coupon.discount_type, v_coupon.discount_value,
                           NULL::DECIMAL(10,2), p_order_amount, 'Coupon usage limit exceeded';
        RETURN;
    END IF;
    
    -- Check minimum order amount
    IF p_order_amount < v_coupon.minimum_order_amount THEN
        RETURN QUERY SELECT false, v_coupon.id, v_coupon.discount_type, v_coupon.discount_value,
                           NULL::DECIMAL(10,2), p_order_amount, 
                           'Order amount does not meet minimum requirement of $' || v_coupon.minimum_order_amount;
        RETURN;
    END IF;
    
    -- Calculate discount
    IF v_coupon.discount_type = 'percentage' THEN
        v_discount_amount := ROUND(p_order_amount * (v_coupon.discount_value / 100), 2);
    ELSE -- fixed_amount
        v_discount_amount := LEAST(v_coupon.discount_value, p_order_amount);
    END IF;
    
    v_final_amount := GREATEST(p_order_amount - v_discount_amount, 0);
    
    -- Return valid result
    RETURN QUERY SELECT true, v_coupon.id, v_coupon.discount_type, v_coupon.discount_value,
                       v_discount_amount, v_final_amount, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to apply coupon (increment usage)
CREATE OR REPLACE FUNCTION apply_coupon_code(
    p_coupon_id UUID,
    p_order_id VARCHAR(255),
    p_artwork_id UUID,
    p_original_amount DECIMAL(10,2),
    p_discount_amount DECIMAL(10,2),
    p_final_amount DECIMAL(10,2),
    p_user_email VARCHAR(255) DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Insert usage record
    INSERT INTO coupon_usage (
        coupon_id, order_id, artwork_id, original_amount, 
        discount_amount, final_amount, user_email, ip_address, user_agent
    ) VALUES (
        p_coupon_id, p_order_id, p_artwork_id, p_original_amount,
        p_discount_amount, p_final_amount, p_user_email, p_ip_address, p_user_agent
    );
    
    -- Increment usage count
    UPDATE coupon_codes 
    SET usage_count = usage_count + 1,
        updated_at = NOW()
    WHERE id = p_coupon_id;
    
    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert test coupon codes
INSERT INTO coupon_codes (code, description, discount_type, discount_value, usage_limit, valid_until, created_by) VALUES
-- Test coupon for $1 pricing (99% off)
('TEST99', 'Test coupon - 99% off for Stripe testing', 'percentage', 99.00, 1000, NOW() + INTERVAL '1 year', 'system'),

-- Test coupon for $1 fixed price
('DOLLAR1', 'Test coupon - $1 fixed price for testing', 'fixed_amount', 28.00, 1000, NOW() + INTERVAL '1 year', 'system'),

-- Test coupon for $44 off
('SAVE44', 'Test coupon - $44 off for testing', 'fixed_amount', 44.00, 1000, NOW() + INTERVAL '1 year', 'system'),

-- Production-ready coupon examples
('WELCOME10', '10% off for new customers', 'percentage', 10.00, NULL, NOW() + INTERVAL '6 months', 'system'),
('SAVE5', '$5 off any order', 'fixed_amount', 5.00, NULL, NOW() + INTERVAL '3 months', 'system'),
('HOLIDAY25', '25% off holiday special', 'percentage', 25.00, 500, NOW() + INTERVAL '2 months', 'system');

-- Enable RLS
ALTER TABLE coupon_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usage ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Public can validate coupons" ON coupon_codes
    FOR SELECT USING (is_active = true);

CREATE POLICY "Service role full access to coupons" ON coupon_codes
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to coupon usage" ON coupon_usage
    FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions
GRANT SELECT ON coupon_codes TO anon, authenticated;
GRANT EXECUTE ON FUNCTION validate_coupon_code TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION apply_coupon_code TO service_role;

COMMENT ON TABLE coupon_codes IS 'Coupon codes for discounts and promotions';
COMMENT ON TABLE coupon_usage IS 'Tracking individual coupon code usage';
COMMENT ON FUNCTION validate_coupon_code IS 'Validates coupon code and calculates discount';
COMMENT ON FUNCTION apply_coupon_code IS 'Records coupon usage and increments counter';
