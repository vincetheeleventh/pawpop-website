# Price Variant Cross-Device Consistency Implementation

## Overview
This document describes the complete implementation of cross-device pricing consistency for PawPop's A/B testing system. The solution ensures users see the same price variant across all devices when they switch from mobile to desktop (or vice versa).

## Problem Statement
Users who saw price variant A on their mobile phone would see variant B on their laptop when opening emails, creating confusion and damaging trust. The variant was only stored in browser localStorage, which doesn't sync across devices.

## Solution: Hybrid Approach (Database + URL Parameters)

### Architecture
```
1. User visits site → Variant assigned → Stored in localStorage
2. User uploads image → Variant captured → Stored in database with artwork
3. All emails → Include ?pv=A or ?pv=B in artwork URLs
4. User opens email on different device → URL parameter sets variant → Syncs to localStorage
5. Artwork page → Respects URL param → Falls back to database → Falls back to localStorage
```

### Priority Chain
1. **URL Parameter** (`?pv=A`) - Highest priority (from emails)
2. **Database Storage** (artwork.price_variant) - Persistent across devices
3. **localStorage** - Fallback for current device
4. **Default** - Variant A if all else fails

## Implementation Details

### 1. Database Schema (Migration 022)

**File:** `/supabase/migrations/022_add_price_variant_column.sql`

```sql
ALTER TABLE artworks 
ADD COLUMN price_variant TEXT CHECK (price_variant IN ('A', 'B'));

-- Set default for existing rows
UPDATE artworks 
SET price_variant = 'A' 
WHERE price_variant IS NULL;

-- Add index for performance
CREATE INDEX idx_artworks_price_variant ON artworks(price_variant);
```

**Rollback:** `/supabase/rollbacks/022_rollback_price_variant_column.sql`

### 2. TypeScript Interfaces

**Updated Files:**
- `/src/lib/supabase.ts` - Added `price_variant?: 'A' | 'B'` to Artwork interface
- `/src/lib/supabase-artworks.ts` - Added to CreateArtworkData interface
- `/src/lib/email.ts` - Added to email data interfaces

### 3. Variant Capture (Upload Flow)

**File:** `/src/components/forms/UploadModal.tsx`

```typescript
// Get current price variant for cross-device consistency
const currentVariant = getPriceVariant();

const createResponse = await fetch('/api/artwork/create', {
  method: 'POST',
  body: JSON.stringify({
    customer_name: formData.name,
    customer_email: formData.email,
    price_variant: currentVariant, // Store variant
  }),
});
```

### 4. Database Storage

**File:** `/src/app/api/artwork/create/route.ts`

```typescript
const { artwork, access_token } = await createArtwork({
  customer_name: customer_name || '',
  customer_email,
  pet_name: pet_name || '',
  price_variant: price_variant || 'A' // Default to variant A
})
```

**File:** `/src/lib/supabase-artworks.ts`

```typescript
.insert({
  // ... other fields
  price_variant: data.price_variant || 'A', // Default to variant A for consistent pricing
})
```

### 5. Email URL Parameters

**File:** `/src/lib/email.ts`

Both `sendMasterpieceCreatingEmail` and `sendMasterpieceReadyEmail` now:

```typescript
// Add price variant to artwork URL for cross-device consistency
const artworkUrl = data.priceVariant 
  ? `${data.artworkUrl}?pv=${data.priceVariant}` 
  : data.artworkUrl
```

**Updated API Routes:**
- `/src/app/api/upload/complete/route.ts` - Passes `priceVariant` from artwork
- `/src/app/api/artwork/update/route.ts` - Passes `priceVariant` from existing artwork
- `/src/app/api/admin/reviews/[reviewId]/process/route.ts` - Fetches and passes `price_variant`

### 6. Artwork Page (URL Parameter Handling)

**File:** `/src/app/artwork/[token]/page.tsx`

```typescript
export default function ArtworkPage({ params, searchParams }: { 
  params: { token: string }; 
  searchParams?: { pv?: string } 
}) {
  const [priceVariant, setPriceVariant] = useState<'A' | 'B'>('A');

  useEffect(() => {
    // Handle price variant from URL parameter
    const urlVariant = searchParams?.pv;
    if (urlVariant && (urlVariant === 'A' || urlVariant === 'B')) {
      // URL parameter takes precedence - store it for consistency
      setPriceVariant(urlVariant);
      localStorage.setItem('pawpop_price_variant', urlVariant);
      localStorage.setItem('pawpop_price_variant_expiry', ...);
    }
  }, [searchParams]);

  const fetchArtwork = async () => {
    // Use artwork's stored price_variant if available and no URL override
    if (data.artwork.price_variant && !searchParams?.pv) {
      setPriceVariant(data.artwork.price_variant);
      // Also store in localStorage for consistency
      localStorage.setItem('pawpop_price_variant', data.artwork.price_variant);
    }
  };
}
```

### 7. Dynamic Pricing with Explicit Variant

**File:** `/src/lib/copy.ts`

```typescript
/**
 * Get dynamic pricing based on current A/B test variant or explicit variant
 * @param explicitVariant - Optional variant override (e.g., from database or URL)
 */
export function getDynamicPricing(explicitVariant?: 'A' | 'B') {
  const priceConfig = explicitVariant 
    ? PRICE_VARIANTS[explicitVariant]
    : getPriceConfig();
  // ... return pricing based on priceConfig
}
```

## Analytics Integration

### Plausible Analytics
The existing Plausible analytics system automatically tracks the price variant in all events:

```typescript
// All events include price variant context
const eventProps = {
  ...props,
  price_variant: this.getPriceVariant(),
  variant_label: PRICE_VARIANTS[this.getPriceVariant()].label
};
```

**Key Events Tracked:**
- `Price Variant Assigned` - When variant is first assigned
- `Upload Modal Opened` - Includes variant context
- `Artwork Generation Started` - Includes variant context
- `Purchase Completed` - Includes variant and revenue data

### Cross-Device Consistency in Analytics
Since the variant is now:
1. Stored in the database with the artwork
2. Passed via URL parameters in emails
3. Synced to localStorage on page load

The analytics will consistently report the same variant for a user across all their sessions and devices, enabling accurate A/B test analysis.

## User Flow Examples

### Scenario 1: Phone → Email on Laptop → Purchase
1. User visits on phone → Variant A assigned → localStorage saves 'A'
2. User uploads → Backend stores variant='A' in database
3. Email sent with URL: `/artwork/token123?pv=A`
4. User opens email on laptop → URL param `pv=A` detected
5. Laptop localStorage updated to 'A' → Sees consistent pricing
6. Analytics tracks as Variant A throughout

### Scenario 2: Desktop → Mobile Email
1. User visits on desktop → Variant B assigned
2. User uploads → Backend stores variant='B'
3. Email sent with URL: `/artwork/token123?pv=B`
4. User opens on mobile → URL param `pv=B` detected
5. Mobile localStorage updated to 'B'
6. Consistent Variant B experience across devices

### Scenario 3: Direct Link (No URL Parameter)
1. User shares artwork link without `?pv=` parameter
2. Artwork page loads → Fetches artwork from database
3. Database has `price_variant='A'`
4. Page uses database variant → Updates localStorage
5. Consistent pricing shown based on original assignment

## Testing

### Manual Testing Steps

1. **Test URL Parameter Override:**
   ```bash
   # Visit with explicit variant
   https://pawpopart.com/artwork/TOKEN?pv=A
   https://pawpopart.com/artwork/TOKEN?pv=B
   # Verify pricing matches variant
   ```

2. **Test Cross-Device Consistency:**
   - Upload image on mobile (check localStorage variant)
   - Check database for artwork's price_variant
   - Open email on desktop
   - Verify URL contains `?pv=X`
   - Verify desktop shows same prices as mobile

3. **Test Database Fallback:**
   - Clear localStorage
   - Visit artwork page without URL parameter
   - Verify pricing matches database-stored variant

4. **Test Analytics Tracking:**
   - Check Plausible dashboard
   - Verify all events include `price_variant` property
   - Confirm consistent variant across user journey

### Database Verification

```sql
-- Check if migration applied
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'artworks' 
AND column_name = 'price_variant';

-- Check variant distribution
SELECT price_variant, COUNT(*) 
FROM artworks 
GROUP BY price_variant;

-- Check specific artwork
SELECT id, customer_email, price_variant, created_at 
FROM artworks 
WHERE access_token = 'YOUR_TOKEN';
```

## Deployment Checklist

- [ ] Apply migration: `022_add_price_variant_column.sql`
- [ ] Verify column exists and index created
- [ ] Deploy updated code to production
- [ ] Test email links include `?pv=` parameter
- [ ] Verify analytics tracking includes variant
- [ ] Monitor error logs for any issues
- [ ] Test cross-device flow with real users

## Rollback Plan

If issues arise:

```sql
-- Run rollback migration
\i supabase/rollbacks/022_rollback_price_variant_column.sql
```

Then redeploy previous code version. The system will fallback to localStorage-only variant assignment (original behavior).

## Benefits

1. **Trust & Consistency:** Users see same prices across all devices
2. **Accurate Analytics:** Proper attribution of conversions to variants
3. **Better UX:** No confusion when switching devices
4. **Data-Driven:** Enables reliable A/B test analysis for pricing optimization

## Future Enhancements

- Add variant override for customer support (admin dashboard)
- Track variant switch events in analytics
- Add variant performance dashboard
- Support more than 2 variants (A/B/C testing)

## Files Modified

### Database
- `/supabase/migrations/022_add_price_variant_column.sql`
- `/supabase/rollbacks/022_rollback_price_variant_column.sql`

### TypeScript Interfaces
- `/src/lib/supabase.ts`
- `/src/lib/supabase-artworks.ts`
- `/src/lib/email.ts`

### Components
- `/src/components/forms/UploadModal.tsx`
- `/src/app/artwork/[token]/page.tsx`

### API Routes
- `/src/app/api/artwork/create/route.ts`
- `/src/app/api/upload/complete/route.ts`
- `/src/app/api/artwork/update/route.ts`
- `/src/app/api/admin/reviews/[reviewId]/process/route.ts`

### Libraries
- `/src/lib/copy.ts`

### Documentation
- `/docs/PRICE_VARIANT_CROSS_DEVICE_CONSISTENCY.md` (this file)

## Support

For questions or issues, refer to:
- Plausible Analytics docs: `/docs/marketing/PLAUSIBLE_ANALYTICS.md`
- Database schema: `/docs/backend/SUPABASE_SCHEMA.sql`
- Original A/B testing implementation in commit history
