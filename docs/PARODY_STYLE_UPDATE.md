# Parody Style Name Update

## Summary
Updated all parody style names and IDs throughout the Pop5Pack codebase to match the new naming convention.

## New Parody Styles

| Order | ID | Name | Image | Description |
|-------|-----|------|-------|-------------|
| 1 | `wizard` | Wizard | `/images/parodypack/parodypack1.png` | Magical wizard portrait |
| 2 | `paws` | PAWS | `/images/parodypack/parodypack2.jpeg` | Iconic movie poster style |
| 3 | `popstar` | Popstar | `/images/parodypack/parodypack3.jpeg` | 80s album cover pose |
| 4 | `dogfather` | Dogfather | `/images/parodypack/parodypack4.jpeg` | Mafia boss portrait |

## Old → New Mapping

| Old ID | Old Name | New ID | New Name |
|--------|----------|--------|----------|
| `wizarding` | Wizarding World | `wizard` | Wizard |
| `jaws` | Jaws | `paws` | PAWS |
| `thriller` | MJ Thriller | `popstar` | Popstar |
| `godfather` | The Godfather | `dogfather` | Dogfather |

## Files Updated

### Component Files
- ✅ `/src/components/pop5pack/ParodyStylesSection.tsx` - Main style definitions with image paths
- ✅ `/src/components/pop5pack/ParodyUploadModal.tsx` - Modal style selection
- ✅ `/src/components/pop5pack/Pop5PackCheckout.tsx` - Checkout page style names and icons

### API Routes
- ✅ `/src/app/api/pop5pack/generate-proof/route.ts` - AI generation prompts
- ✅ `/src/app/api/pop5pack/checkout/route.ts` - Stripe product description and defaults
- ✅ `/src/app/api/test-email/route.ts` - Test email defaults

### Page Files
- ✅ `/src/app/pop5pack/page.tsx` - SEO metadata
- ✅ `/src/app/pop5pack/checkout/[artworkId]/page.tsx` - Checkout page defaults

### Email Templates
- ✅ `/src/lib/email.ts` - Pop5Pack proof email template with all 4 style names

## Image Assets

The actual parody images are located at:
- `/public/images/parodypack/parodypack1.png` - Wizard
- `/public/images/parodypack/parodypack2.jpeg` - PAWS
- `/public/images/parodypack/parodypack3.jpeg` - Popstar
- `/public/images/parodypack/parodypack4.jpeg` - Dogfather

## Database Considerations

**Important:** Existing database records may still have the old style IDs (`wizarding`, `jaws`, `godfather`, `thriller`). The code includes fallback handling to support both old and new IDs.

If you need to migrate existing data:
```sql
-- Update artwork records with old style IDs
UPDATE artworks 
SET generation_metadata = jsonb_set(
  generation_metadata, 
  '{parody_style}', 
  CASE 
    WHEN generation_metadata->>'parody_style' = 'wizarding' THEN '"wizard"'
    WHEN generation_metadata->>'parody_style' = 'jaws' THEN '"paws"'
    WHEN generation_metadata->>'parody_style' = 'thriller' THEN '"popstar"'
    WHEN generation_metadata->>'parody_style' = 'godfather' THEN '"dogfather"'
    ELSE generation_metadata->'parody_style'
  END::jsonb
)
WHERE generation_metadata->>'product_type' = 'pop5pack';
```

## Testing Checklist

- [ ] Test proof generation with new style IDs
- [ ] Verify email template shows correct style names
- [ ] Check checkout page displays correct style information
- [ ] Confirm Stripe product description is updated
- [ ] Test that old style IDs still work (backwards compatibility)
- [ ] Verify images load correctly from `/images/parodypack/`

## Notes

- All style IDs are now lowercase single words for consistency
- Image paths have been added to the style definitions
- Icons remain the same (🪄, 🦈, 🎤, 🎩)
- Default fallback style is now `wizard` (was `wizarding`)
