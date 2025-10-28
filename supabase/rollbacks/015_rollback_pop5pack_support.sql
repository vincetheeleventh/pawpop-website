-- Rollback: Remove Pop5Pack support

-- Drop helper functions
DROP FUNCTION IF EXISTS get_pop5pack_artworks(TEXT, BOOLEAN);
DROP FUNCTION IF EXISTS create_pop5pack_purchase(UUID, TEXT, INTEGER);

-- Drop indexes
DROP INDEX IF EXISTS idx_artworks_product_type;
DROP INDEX IF EXISTS idx_artworks_parody_style;
DROP INDEX IF EXISTS idx_artworks_is_proof;

-- Remove comment
COMMENT ON TABLE artworks IS NULL;
