BEGIN;

-- 1. Create coupon_codes table
CREATE TABLE IF NOT EXISTS coupon_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('set_price', 'amount_off', 'percent_off')),
  discount_value INTEGER NOT NULL,
  max_redemptions INTEGER,
  redemption_count INTEGER NOT NULL DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE,
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupon_codes_code ON coupon_codes(code);
CREATE INDEX IF NOT EXISTS idx_coupon_codes_active ON coupon_codes(is_active);

-- Trigger to maintain updated_at
CREATE OR REPLACE FUNCTION update_coupon_codes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_coupon_codes_updated_at ON coupon_codes;
CREATE TRIGGER trg_coupon_codes_updated_at
BEFORE UPDATE ON coupon_codes
FOR EACH ROW
EXECUTE FUNCTION update_coupon_codes_updated_at();

-- Helper function to increment coupon redemption count atomically
CREATE OR REPLACE FUNCTION increment_coupon_redemption(target_coupon_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE coupon_codes
  SET redemption_count = redemption_count + 1,
      updated_at = NOW()
  WHERE id = target_coupon_id;
END;
$$;

-- 2. Extend orders table with coupon + pricing metadata
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS original_price_cents INTEGER,
  ADD COLUMN IF NOT EXISTS discount_cents INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES coupon_codes(id),
  ADD COLUMN IF NOT EXISTS coupon_code TEXT;

UPDATE orders
SET original_price_cents = price_cents
WHERE original_price_cents IS NULL;

ALTER TABLE orders
  ALTER COLUMN original_price_cents SET NOT NULL;

ALTER TABLE orders
  ADD CONSTRAINT chk_orders_discount_nonnegative CHECK (discount_cents >= 0);

CREATE INDEX IF NOT EXISTS idx_orders_coupon_id ON orders(coupon_id);
CREATE INDEX IF NOT EXISTS idx_orders_coupon_code ON orders(coupon_code);

-- 3. Enable RLS and grant service role access for coupon_codes
ALTER TABLE coupon_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access to coupon codes" ON coupon_codes;
CREATE POLICY "Service role full access to coupon codes" ON coupon_codes
  FOR ALL TO service_role USING (true) WITH CHECK (true);

COMMIT;
