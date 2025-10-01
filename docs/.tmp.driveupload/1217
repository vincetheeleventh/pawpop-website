# Admin Artwork Regeneration Feature

## Overview
The Admin Regeneration feature allows administrators to refine and regenerate artwork by tweaking the pet integration prompt without requiring the customer to re-upload images. This provides fine-grained control over artwork quality and positioning.

## Features Implemented

### 1. Database Schema
- **Migration**: `023_add_regeneration_history.sql`
- **New Column**: `regeneration_history` JSONB array on `admin_reviews` table
- **History Structure**:
  ```json
  [{
    "timestamp": "2025-01-30T12:00:00Z",
    "image_url": "https://...",
    "monalisa_base_url": "https://...",
    "prompt_tweak": "Make pet smaller",
    "regenerated_monalisa": false,
    "fal_generation_url": "https://..."
  }]
  ```

### 2. API Endpoint
**POST** `/api/admin/reviews/[reviewId]/regenerate`

**Request Body**:
```json
{
  "prompt_tweak": "Make the pet smaller",
  "regenerate_monalisa": false
}
```

**Response**:
```json
{
  "success": true,
  "image_url": "https://...",
  "monalisa_base_url": "https://...",
  "fal_generation_url": "https://...",
  "regeneration_history": [...]
}
```

### 3. Admin UI Components

#### Regeneration Controls
- **Location**: `/admin/reviews/[reviewId]` page
- **Quick Preset Buttons**:
  - Make pet smaller
  - Make pet larger
  - Move pet left
  - Move pet right
  - Position higher
  - Position lower

#### Custom Prompt Tweak
- Text area for custom prompt modifications
- Real-time full prompt preview
- Character-by-character editing

#### MonaLisa Base Toggle
- Checkbox to regenerate MonaLisa portrait
- Option to reuse existing MonaLisa base for faster regeneration

### 4. Visual Components

#### MonaLisa Base Viewer
- Collapsible section showing MonaLisa portrait
- Helps admin understand the base image being used
- Toggle with ChevronUp/ChevronDown icons

#### Regeneration History
- Collapsible history showing all previous attempts
- Each entry displays:
  - Version number and timestamp
  - Prompt tweak used
  - Whether MonaLisa was regenerated
  - Thumbnail of generated artwork
- Visual badges for regeneration type

## Workflow

### Admin Regeneration Process
1. **Review artwork** in admin dashboard
2. **Identify improvement** needed (e.g., pet too large)
3. **Select preset** or write custom prompt tweak
4. **Preview full prompt** before regenerating
5. **Optionally check** "Regenerate MonaLisa base too"
6. **Click Regenerate** button
7. **Wait for processing** (30-60 seconds)
8. **Review new artwork** - replaces current image
9. **View history** to compare with previous versions
10. **Approve or regenerate again** as needed

### Technical Flow
```
1. Admin submits regeneration request
   ↓
2. API fetches review + artwork + source images
   ↓
3. Save current image to regeneration_history
   ↓
4. If regenerate_monalisa: Call /api/monalisa-maker
   ↓
5. Call /api/pet-integration with prompt_tweak
   ↓
6. Update admin_reviews.image_url with new image
   ↓
7. Append new entry to regeneration_history
   ↓
8. Return updated review data to UI
   ↓
9. UI refreshes and shows new artwork
```

## Prompt Engineering

### Base Prompt
```
"Incorporate the pet into the painting of the woman. She is holding it in her lap. Keep the painted style and likeness of the woman and pet"
```

### Prompt Tweak Appending
When admin enters tweak like "Make the pet smaller", the final prompt becomes:
```
"Incorporate the pet into the painting of the woman. She is holding it in her lap. Keep the painted style and likeness of the woman and pet. Make the pet smaller"
```

### Best Practices for Prompt Tweaks
- **Be specific**: "Make pet 30% smaller" vs "Make pet smaller"
- **Single instruction**: Focus on one change at a time
- **Positioning**: Use relative terms (left, right, higher, lower)
- **Size adjustments**: Use comparative terms (smaller, larger)
- **Avoid negatives**: Use positive instructions

## Customer Experience

### Notification Timeline
- Customer is **NOT** notified during regeneration
- Customer only receives email when admin **approves** final version
- No impact on customer experience - transparent refinement process

### Review History
- Customers never see regeneration history
- Only final approved artwork is delivered
- Maintains professional "handcrafted" positioning

## Performance Considerations

### Generation Times
- **Pet integration only**: 30-45 seconds
- **MonaLisa + Pet integration**: 60-90 seconds
- **No blocking**: Admin can navigate away during generation

### Storage
- Each regeneration stores new image in Supabase storage
- History tracked in JSONB - minimal database overhead
- Old images remain accessible via history URLs

### Rate Limiting
- No hard limit on regeneration attempts
- Recommended max: 5 attempts per artwork
- Cost consideration: Each regeneration = 1 fal.ai API call

## Error Handling

### Missing Source Images
- UI displays warning: "Source images not available"
- Regenerate button disabled
- Occurs if artwork created before source images tracking

### API Failures
- MonaLisa generation failure: Error displayed, stops process
- Pet integration failure: Error displayed with details
- Network timeout: Retry mechanism with exponential backoff

### Database Errors
- History update failure: Logged but doesn't block regeneration
- Review update failure: Transaction rolled back, error shown

## Testing

### Test Coverage
- Prompt tweak appending logic
- History array management
- API request/response structure
- Error handling paths
- UI state management

### Manual Testing Checklist
- [ ] Click preset buttons populate prompt tweak
- [ ] Custom text in prompt tweak works
- [ ] Full prompt preview updates in real-time
- [ ] "Regenerate MonaLisa base" checkbox toggles
- [ ] Regeneration replaces current image
- [ ] History section shows all previous versions
- [ ] History entries display correctly formatted
- [ ] MonaLisa base viewer shows/hides correctly
- [ ] Loading states work (spinner on button)
- [ ] Success message appears after regeneration
- [ ] Error handling works for missing images

## Future Enhancements

### Potential Improvements
1. **Parallel Comparison**: Side-by-side view of current vs history
2. **Rollback**: Click history entry to restore that version
3. **Preset Library**: Save frequently used prompt tweaks
4. **A/B Testing**: Generate multiple variants simultaneously
5. **Customer Feedback Loop**: Learn from customer edit requests
6. **AI Suggestions**: Recommend prompt tweaks based on image analysis
7. **Batch Regeneration**: Process multiple reviews with same tweak

## Related Documentation
- [Admin Review System](/docs/features/EDIT_REQUEST_FEATURE.md)
- [Manual Approval Workflow](/docs/features/ADMIN_REVIEW_FEATURE.md)
- [Pet Integration API](/docs/backend/PET_INTEGRATION_API.md)
- [MonaLisa Maker API](/docs/backend/MONALISA_MAKER_API.md)

## Migration Instructions

### Database Migration
1. Run migration in Supabase Dashboard SQL Editor:
   ```sql
   -- Execute: supabase/migrations/023_add_regeneration_history.sql
   ```
2. Verify column added:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'admin_reviews' 
   AND column_name = 'regeneration_history';
   ```

### Rollback if Needed
```sql
-- Execute: supabase/rollbacks/023_rollback_regeneration_history.sql
```

## Support & Troubleshooting

### Common Issues

**Issue**: Regenerate button disabled
- **Cause**: Missing source_images in artwork record
- **Fix**: Artwork must have pet_mom_photo and pet_photo in source_images JSONB

**Issue**: Regeneration takes too long
- **Cause**: MonaLisa regeneration + pet integration
- **Fix**: Uncheck "Regenerate MonaLisa base" to speed up (30s vs 90s)

**Issue**: History not displaying
- **Cause**: First regeneration hasn't happened yet
- **Fix**: Regeneration history only appears after first regeneration attempt

**Issue**: Prompt tweak not taking effect
- **Cause**: Tweak may be too subtle or contradictory
- **Fix**: Be more specific and directive in prompt wording

## Deployment Checklist
- [ ] Database migration executed in production
- [ ] Environment variables configured
- [ ] API endpoint accessible
- [ ] Admin dashboard updated
- [ ] Tests passing
- [ ] Documentation updated
- [ ] Team trained on feature usage
- [ ] Monitoring alerts configured for API errors

---

**Last Updated**: 2025-01-30
**Feature Status**: ✅ Production Ready
**Maintainer**: PawPop Engineering Team
