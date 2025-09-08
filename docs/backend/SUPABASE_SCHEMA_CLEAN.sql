-- PawPop Clean Database Schema
-- Consolidated approach with proper user association and lifecycle management

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enhanced users table with anonymous user support
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  is_anonymous BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Consolidated artworks table - ONE record per artwork lifecycle
CREATE TABLE artworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Customer information
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  pet_name TEXT,
  
  -- Image URLs - consolidated approach
  pet_mom_image_url TEXT NOT NULL,
  pet_image_url TEXT NOT NULL,
  generated_image_url TEXT, -- MonaLisa result
  upscaled_image_url TEXT,  -- High-res version for prints
  
  -- Status tracking - single source of truth
  generation_status TEXT DEFAULT 'pending' CHECK (generation_status IN ('pending', 'processing', 'completed', 'failed')),
  upscale_status TEXT DEFAULT 'not_started' CHECK (upscale_status IN ('not_started', 'pending', 'processing', 'completed', 'failed')),
  
  -- Timestamps
  generation_started_at TIMESTAMP WITH TIME ZONE,
  generation_completed_at TIMESTAMP WITH TIME ZONE,
  upscale_started_at TIMESTAMP WITH TIME ZONE,
  upscale_completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Access control
  access_token TEXT UNIQUE NOT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Printify integration
  mockup_urls JSONB,
  mockup_generated_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  fal_request_id TEXT, -- Track FAL.ai request
  generation_params JSONB, -- Store generation parameters
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table (unchanged - already clean)
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artwork_id UUID REFERENCES artworks(id) ON DELETE CASCADE,
  stripe_session_id TEXT UNIQUE NOT NULL,
  stripe_payment_intent_id TEXT,
  product_type TEXT NOT NULL CHECK (product_type IN ('digital', 'art_print', 'framed_canvas')),
  product_size TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  customer_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  shipping_address JSONB,
  order_status TEXT DEFAULT 'pending' CHECK (order_status IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'failed')),
  printify_order_id TEXT,
  printify_status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order status history (unchanged)
CREATE TABLE order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX idx_artworks_user ON artworks(user_id);
CREATE INDEX idx_artworks_email ON artworks(customer_email);
CREATE INDEX idx_artworks_token ON artworks(access_token);
CREATE INDEX idx_artworks_generation_status ON artworks(generation_status);
CREATE INDEX idx_artworks_upscale_status ON artworks(upscale_status);
CREATE INDEX idx_orders_stripe_session ON orders(stripe_session_id);
CREATE INDEX idx_orders_artwork ON orders(artwork_id);
CREATE INDEX idx_orders_status ON orders(order_status);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_artworks_updated_at BEFORE UPDATE ON artworks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Users can view artworks by email (anonymous user support)
CREATE POLICY "Users can view artworks by email" ON artworks
    FOR SELECT USING (
        customer_email = (SELECT email FROM users WHERE id = auth.uid())
        OR auth.jwt() ->> 'role' = 'service_role'
    );

-- Service role can access all data
CREATE POLICY "Service role can access all artworks" ON artworks
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can access all orders" ON orders
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Helper functions for clean operations
CREATE OR REPLACE FUNCTION create_anonymous_user(user_email TEXT)
RETURNS UUID AS $$
DECLARE
    user_uuid UUID;
BEGIN
    -- Check if user already exists
    SELECT id INTO user_uuid FROM users WHERE email = user_email;
    
    -- Create if doesn't exist
    IF user_uuid IS NULL THEN
        INSERT INTO users (email, is_anonymous) 
        VALUES (user_email, true) 
        RETURNING id INTO user_uuid;
    END IF;
    
    RETURN user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get artwork with complete lifecycle info
CREATE OR REPLACE FUNCTION get_artwork_lifecycle(artwork_token TEXT)
RETURNS TABLE (
    artwork_id UUID,
    customer_name TEXT,
    customer_email TEXT,
    pet_name TEXT,
    generation_status TEXT,
    upscale_status TEXT,
    generated_image_url TEXT,
    upscaled_image_url TEXT,
    mockup_urls JSONB,
    created_at TIMESTAMP WITH TIME ZONE,
    generation_completed_at TIMESTAMP WITH TIME ZONE,
    upscale_completed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.customer_name,
        a.customer_email,
        a.pet_name,
        a.generation_status,
        a.upscale_status,
        a.generated_image_url,
        a.upscaled_image_url,
        a.mockup_urls,
        a.created_at,
        a.generation_completed_at,
        a.upscale_completed_at
    FROM artworks a
    WHERE a.access_token = artwork_token
    AND a.token_expires_at > NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
