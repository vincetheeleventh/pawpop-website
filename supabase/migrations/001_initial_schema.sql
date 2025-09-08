-- Migration: 001_initial_schema
-- Description: Initial PawPop database schema with all current tables
-- Author: migration_system
-- Date: 2025-01-08

-- Validate prerequisites (should be version 0 for initial migration)
DO $$
BEGIN
  -- For initial migration, we expect no schema_version table or version 0
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'schema_version') THEN
    IF (SELECT version FROM schema_version ORDER BY applied_at DESC LIMIT 1) != 0 THEN
      RAISE EXCEPTION 'Migration 001 requires version 0, current: %', 
        (SELECT version FROM schema_version ORDER BY applied_at DESC LIMIT 1);
    END IF;
  END IF;
END $$;

BEGIN;

-- Create schema_version table if it doesn't exist
CREATE TABLE IF NOT EXISTS schema_version (
  id SERIAL PRIMARY KEY,
  version INTEGER NOT NULL,
  description TEXT NOT NULL,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  applied_by TEXT DEFAULT 'system',
  rollback_available BOOLEAN DEFAULT true
);

-- Create exec_sql function for migration system
CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result TEXT;
BEGIN
    -- Security check: Only allow service role
    IF current_setting('request.jwt.claims', true)::json->>'role' != 'service_role' THEN
        RAISE EXCEPTION 'Access denied: exec_sql requires service role';
    END IF;
    
    -- Execute the SQL
    EXECUTE sql_query;
    
    -- Return success message
    result := 'SQL executed successfully';
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Re-raise the exception with context
        RAISE EXCEPTION 'SQL execution failed: %', SQLERRM;
END;
$$;

-- Grant permissions for exec_sql
GRANT EXECUTE ON FUNCTION exec_sql(TEXT) TO service_role;
REVOKE EXECUTE ON FUNCTION exec_sql(TEXT) FROM anon, authenticated;

-- Helper functions for schema management
CREATE OR REPLACE FUNCTION get_schema_version()
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT version FROM schema_version ORDER BY applied_at DESC LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION validate_migration(required_version INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
  IF get_schema_version() != required_version THEN
    RAISE EXCEPTION 'Migration requires version %, current version: %', 
      required_version, get_schema_version();
  END IF;
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create artworks table (main table for PawPop)
CREATE TABLE IF NOT EXISTS artworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  access_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'base64url'),
  email TEXT NOT NULL,
  pet_photo_url TEXT NOT NULL,
  pet_mom_photo_url TEXT NOT NULL,
  generated_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  
  -- Upscaling fields
  upscaled_image_url TEXT,
  upscale_status TEXT DEFAULT 'not_required' CHECK (upscale_status IN ('not_required', 'pending', 'processing', 'completed', 'failed')),
  upscaled_at TIMESTAMP WITH TIME ZONE,
  
  -- Printify mockup fields
  mockup_urls JSONB DEFAULT '{}',
  mockup_generated_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days')
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artwork_id UUID REFERENCES artworks(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT UNIQUE NOT NULL,
  stripe_checkout_session_id TEXT,
  
  -- Customer info
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  
  -- Product details
  product_type TEXT NOT NULL CHECK (product_type IN ('digital', 'art_print', 'framed_canvas')),
  product_size TEXT,
  product_variant TEXT,
  
  -- Pricing
  amount_total INTEGER NOT NULL, -- in cents
  currency TEXT DEFAULT 'usd',
  
  -- Order status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  
  -- Printify integration
  printify_product_id TEXT,
  printify_order_id TEXT,
  printify_status TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE,
  shipped_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_artworks_access_token ON artworks(access_token);
CREATE INDEX IF NOT EXISTS idx_artworks_email ON artworks(email);
CREATE INDEX IF NOT EXISTS idx_artworks_status ON artworks(status);
CREATE INDEX IF NOT EXISTS idx_artworks_upscale_status ON artworks(upscale_status);
CREATE INDEX IF NOT EXISTS idx_artworks_expires_at ON artworks(expires_at);

CREATE INDEX IF NOT EXISTS idx_orders_artwork_id ON orders(artwork_id);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_payment_intent ON orders(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_printify_order_id ON orders(printify_order_id);

-- Enable Row Level Security
ALTER TABLE artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for artworks
CREATE POLICY "Artworks are accessible via access token" ON artworks
  FOR ALL USING (true); -- Service role can access all, client uses access_token in queries

CREATE POLICY "Service role full access to artworks" ON artworks
  FOR ALL TO service_role USING (true);

-- RLS Policies for orders  
CREATE POLICY "Orders are accessible by customer email" ON orders
  FOR ALL USING (true); -- Service role manages all access

CREATE POLICY "Service role full access to orders" ON orders
  FOR ALL TO service_role USING (true);

-- Update schema version
INSERT INTO schema_version (version, description, applied_by)
VALUES (1, 'Initial PawPop schema with artworks and orders', 'migration_system')
ON CONFLICT DO NOTHING;

COMMIT;
