-- PawPop Supabase Database Schema
-- This file contains all the SQL commands needed to set up the database schema for PawPop

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (if not exists from auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generated artworks table
CREATE TABLE artworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  original_image_url TEXT NOT NULL,
  generated_image_url TEXT,
  pet_name TEXT,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  original_pet_mom_url TEXT,
  original_pet_url TEXT,
  access_token TEXT UNIQUE,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  generation_status TEXT DEFAULT 'pending' CHECK (generation_status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
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

-- Order status history
CREATE TABLE order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_orders_stripe_session ON orders(stripe_session_id);
CREATE INDEX idx_orders_status ON orders(order_status);
CREATE INDEX idx_orders_printify ON orders(printify_order_id);
CREATE INDEX idx_artworks_user ON artworks(user_id);
CREATE INDEX idx_artworks_status ON artworks(generation_status);
CREATE INDEX idx_order_history_order ON order_status_history(order_id);

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
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

-- Policies for artworks
CREATE POLICY "Users can view their own artworks" ON artworks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own artworks" ON artworks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own artworks" ON artworks
    FOR UPDATE USING (auth.uid() = user_id);

-- Policies for orders
CREATE POLICY "Users can view orders for their artworks" ON orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM artworks 
            WHERE artworks.id = orders.artwork_id 
            AND artworks.user_id = auth.uid()
        )
    );

-- Service role can access all data (for webhooks and server operations)
CREATE POLICY "Service role can access all artworks" ON artworks
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can access all orders" ON orders
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can access all order history" ON order_status_history
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Functions for common operations
CREATE OR REPLACE FUNCTION get_order_with_artwork(order_stripe_session_id TEXT)
RETURNS TABLE (
    order_id UUID,
    artwork_id UUID,
    stripe_session_id TEXT,
    product_type TEXT,
    product_size TEXT,
    customer_name TEXT,
    customer_email TEXT,
    order_status TEXT,
    printify_order_id TEXT,
    generated_image_url TEXT,
    pet_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.artwork_id,
        o.stripe_session_id,
        o.product_type,
        o.product_size,
        o.customer_name,
        o.customer_email,
        o.order_status,
        o.printify_order_id,
        a.generated_image_url,
        a.pet_name
    FROM orders o
    JOIN artworks a ON o.artwork_id = a.id
    WHERE o.stripe_session_id = order_stripe_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get failed orders for retry
CREATE OR REPLACE FUNCTION get_failed_orders()
RETURNS TABLE (
    order_id UUID,
    artwork_id UUID,
    stripe_session_id TEXT,
    product_type TEXT,
    product_size TEXT,
    customer_name TEXT,
    generated_image_url TEXT,
    pet_name TEXT,
    shipping_address JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.artwork_id,
        o.stripe_session_id,
        o.product_type,
        o.product_size,
        o.customer_name,
        a.generated_image_url,
        a.pet_name,
        o.shipping_address
    FROM orders o
    JOIN artworks a ON o.artwork_id = a.id
    WHERE o.order_status = 'paid'
    AND o.printify_order_id IS NULL
    AND o.product_type != 'digital'
    ORDER BY o.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
