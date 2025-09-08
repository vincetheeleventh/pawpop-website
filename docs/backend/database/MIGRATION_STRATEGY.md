# Database Migration Strategy: Clean Artwork Management

## Overview
This document outlines the migration from the current fragmented artwork storage to a clean, consolidated approach with proper user association and lifecycle management.

## Current Problems
- Multiple artwork records per customer due to test entries and failed uploads
- NULL `user_id` fields preventing proper organization
- Confusing `original_image_url` field with test values like "test-pending"
- No clear lifecycle tracking for generation and upscaling
- Cluttered database with development artifacts

## Clean Schema Benefits
- **One record per artwork lifecycle** - from upload to final high-res print
- **Proper user association** - anonymous users created automatically by email
- **Clear status tracking** - separate generation and upscale status fields
- **Consolidated image URLs** - pet_mom_image_url, pet_image_url, generated_image_url, upscaled_image_url
- **Automatic timestamps** - track when each phase starts and completes
- **Clean test data separation** - no more "test-pending" entries mixed with real data

## Migration Steps

### Phase 1: Deploy Clean Schema (Parallel)
1. Create new tables with `_v2` suffix to run parallel to existing system
2. Deploy clean artwork management functions
3. Update upload flow to use new schema for new artworks
4. Keep existing system running for current artworks

### Phase 2: Data Migration
```sql
-- Create anonymous users for existing customers
INSERT INTO users (email, is_anonymous)
SELECT DISTINCT customer_email, true
FROM artworks 
WHERE customer_email IS NOT NULL
ON CONFLICT (email) DO NOTHING;

-- Migrate clean artwork records (filter out test data)
INSERT INTO artworks_v2 (
  user_id, customer_name, customer_email, pet_name,
  pet_mom_image_url, pet_image_url, generated_image_url,
  generation_status, access_token, token_expires_at,
  created_at, updated_at
)
SELECT 
  u.id as user_id,
  a.customer_name,
  a.customer_email,
  a.pet_name,
  COALESCE(a.original_pet_mom_url, 'migrated-missing') as pet_mom_image_url,
  COALESCE(a.original_pet_url, 'migrated-missing') as pet_image_url,
  a.generated_image_url,
  a.generation_status,
  a.access_token,
  a.token_expires_at,
  a.created_at,
  a.updated_at
FROM artworks a
JOIN users u ON u.email = a.customer_email
WHERE a.customer_email IS NOT NULL
  AND a.access_token IS NOT NULL
  AND a.original_image_url NOT LIKE 'test-%'  -- Skip test data
  AND a.generation_status = 'completed'       -- Only migrate successful artworks
ORDER BY a.created_at;
```

### Phase 3: Switch Over
1. Update all API endpoints to use new schema
2. Rename tables: `artworks` → `artworks_old`, `artworks_v2` → `artworks`
3. Update all references in codebase
4. Test complete flow end-to-end

### Phase 4: Cleanup
1. Verify all functionality works with new schema
2. Drop old tables after 30-day safety period
3. Clean up any remaining test data

## Updated Workflow

### New Artwork Creation Flow
```typescript
// 1. User uploads photos via UploadThing
const petMomUrl = "https://uploadthing.com/..."
const petUrl = "https://uploadthing.com/..."

// 2. Create single artwork record with all info
const { artwork, access_token } = await createArtwork({
  customer_name: "Jane Doe",
  customer_email: "jane@example.com", 
  pet_name: "Buddy",
  pet_mom_image_url: petMomUrl,
  pet_image_url: petUrl
})

// 3. Start generation and update status
await updateArtworkLifecycle(artwork.id, {
  generation_status: 'processing',
  fal_request_id: 'fal_123'
})

// 4. Complete generation
await updateArtworkLifecycle(artwork.id, {
  generation_status: 'completed',
  generated_image_url: 'https://fal.ai/result.jpg'
})

// 5. If high-res needed for print order
await updateArtworkLifecycle(artwork.id, {
  upscale_status: 'processing'
})

// 6. Complete upscaling
await updateArtworkLifecycle(artwork.id, {
  upscale_status: 'completed',
  upscaled_image_url: 'https://fal.ai/upscaled.jpg'
})
```

### Customer View
```sql
-- Get all artworks for customer jane@example.com
SELECT * FROM artworks WHERE customer_email = 'jane@example.com'
ORDER BY created_at DESC;

-- Result: Clean list showing:
-- 1. Buddy's MonaLisa (completed, ready for prints)
-- 2. Max's MonaLisa (processing, 2 min remaining)
-- 3. Luna's MonaLisa (completed, high-res available)
```

## Benefits After Migration
- **Clean customer experience**: Each customer sees only their artworks
- **Proper lifecycle tracking**: Clear status for generation and upscaling
- **Efficient queries**: Indexed by user, email, status for fast lookups
- **Maintainable codebase**: Single source of truth for artwork state
- **Scalable architecture**: Ready for user accounts when needed

## Rollback Plan
If issues arise during migration:
1. Switch API endpoints back to old schema
2. Keep both schemas until issues resolved
3. Old data remains untouched as fallback
4. Gradual rollout possible per customer email

## Testing Strategy
1. **Unit tests**: All new functions with clean schema
2. **Integration tests**: Complete upload → generation → order flow
3. **Data validation**: Verify migration preserves all critical data
4. **Performance tests**: Ensure queries perform well with indexes
5. **User acceptance**: Test with real customer workflows
