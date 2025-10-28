-- Migration: Add Pop5Pack support to existing schema
-- This extends the artworks table to support the new digital-first parody pack business model

-- Add comment to document the new product type
COMMENT ON TABLE artworks IS 'Stores all artwork generations including Mona Lisa (legacy) and Pop5Pack (new digital-first model)';

-- The existing schema already supports what we need via JSONB fields:
-- - generation_metadata: Can store { product_type: 'pop5pack', parody_style: 'wizarding', is_proof: true }
-- - generated_images: Can store multiple parody styles in generation_steps
-- - source_images: Already stores pet_photo (no pet_mom needed for Pop5Pack)

-- Add index for faster Pop5Pack queries
CREATE INDEX IF NOT EXISTS idx_artworks_product_type 
ON artworks ((generation_metadata->>'product_type'));

CREATE INDEX IF NOT EXISTS idx_artworks_parody_style 
ON artworks ((generation_metadata->>'parody_style'));

CREATE INDEX IF NOT EXISTS idx_artworks_is_proof 
ON artworks ((generation_metadata->>'is_proof'));

-- Add helper function to get Pop5Pack artworks
CREATE OR REPLACE FUNCTION get_pop5pack_artworks(
  p_email TEXT DEFAULT NULL,
  p_is_proof BOOLEAN DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  customer_email TEXT,
  parody_style TEXT,
  is_proof BOOLEAN,
  generation_step TEXT,
  created_at TIMESTAMPTZ,
  artwork_preview_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.customer_email,
    a.generation_metadata->>'parody_style' as parody_style,
    (a.generation_metadata->>'is_proof')::BOOLEAN as is_proof,
    a.generation_step::TEXT,
    a.created_at,
    a.generated_images->'artwork_preview'->>'url' as artwork_preview_url
  FROM artworks a
  WHERE 
    a.generation_metadata->>'product_type' = 'pop5pack'
    AND (p_email IS NULL OR a.customer_email = p_email)
    AND (p_is_proof IS NULL OR (a.generation_metadata->>'is_proof')::BOOLEAN = p_is_proof)
  ORDER BY a.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add helper function to create Pop5Pack pack purchase record
CREATE OR REPLACE FUNCTION create_pop5pack_purchase(
  p_artwork_id UUID,
  p_stripe_session_id TEXT,
  p_amount_cents INTEGER
)
RETURNS UUID AS $$
DECLARE
  v_order_id UUID;
BEGIN
  -- Create order record
  INSERT INTO orders (
    artwork_id,
    customer_email,
    product_type,
    total_amount_cents,
    stripe_session_id,
    order_status,
    order_metadata
  )
  SELECT 
    p_artwork_id,
    customer_email,
    'pop5pack_digital',
    p_amount_cents,
    p_stripe_session_id,
    'pending',
    jsonb_build_object(
      'product_type', 'pop5pack',
      'parody_style', generation_metadata->>'parody_style',
      'pack_price_cents', p_amount_cents,
      'delivery_method', 'digital'
    )
  FROM artworks
  WHERE id = p_artwork_id
  RETURNING id INTO v_order_id;

  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_pop5pack_artworks TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION create_pop5pack_purchase TO authenticated, anon, service_role;

-- Add comments for documentation
COMMENT ON FUNCTION get_pop5pack_artworks IS 'Retrieves Pop5Pack artworks with optional filtering by email and proof status';
COMMENT ON FUNCTION create_pop5pack_purchase IS 'Creates an order record for a Pop5Pack digital purchase';
