# Mockup Display Implementation

## Overview
The PawPop artwork page features a sophisticated mockup display system that showcases real Printify product mockups with consistent front-facing views (Context 1) and interactive carousel navigation.

## Technical Architecture

### MockupDisplay Component
**File:** `/src/components/artwork/MockupDisplay.tsx`

#### Key Features
- **Real Printify Integration:** Displays actual product mockups generated via Printify API
- **Context 1 Consistency:** All mockups use front-facing camera angles for uniform presentation
- **Interactive Carousel:** Thumbnail navigation with smooth transitions
- **Graceful Fallbacks:** Placeholder mockups if Printify API fails
- **Loading States:** Professional loading indicators during mockup fetch

#### Component Structure
```typescript
interface MockupDisplayProps {
  artworkId: string;
  delivery_images?: {
    mockups?: {
      art_print: MockupItem[];
      canvas_stretched: MockupItem[];
      canvas_framed: MockupItem[];
    };
  };
}
```

### Printify API Integration

#### Mockup Generation Endpoint
**File:** `/src/app/api/printify/generate-mockups/route.ts`

**Key Improvements:**
- **Context 1 Filtering:** Prioritizes `camera_label=front` and `position=front` mockups
- **Consistent Product Types:** Art Print, Canvas Stretched, Canvas Framed
- **Automatic Triggering:** Mockups generated automatically after artwork completion
- **Database Storage:** Mockup URLs stored in `delivery_images.mockups` field

#### Mockup Selection Logic
```typescript
// Prioritize front-facing views (Context 1)
const frontFacingMockup = mockups.find(m => 
  m.camera_label === 'front' || m.position === 'front'
) || mockups[0]; // Fallback to first available
```

### Product Configuration

#### Supported Product Types
1. **Art Print**
   - Blueprint ID: 1191 (North America) / 494 (Europe)
   - Sizes: 12x18", 18x24", 20x30"
   - Pricing: $29-$48 CAD

2. **Canvas Stretched**
   - Blueprint ID: 1159 (Matte Canvas, Stretched, 1.25")
   - Sizes: 12x18", 18x24", 20x30"
   - Pricing: $59-$99 CAD
   - Frame Upgrade: +$40 CAD

3. **Canvas Framed**
   - Blueprint ID: 944 (Matte Canvas, Framed Multi-color)
   - Sizes: 12x18", 18x24", 20x30"
   - Pricing: $99-$149 CAD

### Database Schema

#### Artwork Table Updates
```sql
-- delivery_images JSONB field structure
{
  "mockups": {
    "art_print": [
      {
        "type": "art_print",
        "title": "Premium Art Print (20x30\")",
        "description": "Museum-quality paper with archival inks",
        "mockupUrl": "https://images-api.printify.com/mockup/...",
        "productId": "art-print-20x30",
        "size": "20x30"
      }
    ],
    "canvas_stretched": [...],
    "canvas_framed": [...]
  }
}
```

## User Experience Flow

### 1. Artwork Page Load
- User visits `/artwork/[token]`
- MockupDisplay component loads with artwork data
- Displays loading state while fetching mockups

### 2. Mockup Display
- Shows three product type categories
- Each category displays front-facing product mockup
- Thumbnail navigation allows browsing different views
- Clicking mockup opens purchase modal with selected product

### 3. Interactive Features
- **Carousel Navigation:** Smooth transitions between mockup views
- **Clickable Mockups:** Direct path to purchase modal
- **Responsive Design:** Optimized for mobile and desktop
- **Loading States:** Professional loading indicators

## Performance Optimizations

### Caching Strategy
- Mockup URLs cached in database after generation
- Reduces API calls to Printify for subsequent views
- Fallback to placeholder mockups if cache miss

### Image Optimization
- Printify mockup URLs include optimization parameters
- `camera_label=front` ensures consistent viewing angles
- High-quality images optimized for web display

### Error Handling
- Graceful degradation if Printify API unavailable
- Placeholder mockups maintain user experience
- Error logging for debugging and monitoring

## Technical Implementation Details

### Context 1 Implementation
**Problem:** Mixed camera angles created inconsistent product presentation
**Solution:** Filter mockups to prioritize front-facing views

```typescript
// Updated mockup filtering logic
const contextOneMockups = mockups.filter(mockup => 
  mockup.camera_label === 'front' || 
  mockup.position === 'front'
);
```

### Automatic Mockup Generation
**Integration Point:** `/src/app/api/artwork/update/route.ts`

When artwork generation completes:
1. Artwork status updated to "completed"
2. Mockup generation automatically triggered
3. Real Printify mockups created and stored
4. User sees professional product visualization

### Purchase Modal Integration
**Component:** Various PurchaseModal variants

Mockup clicks pass product type and size to purchase modals:
- Pre-selects clicked product type
- Shows accurate pricing from PRODUCTS.md
- Maintains context from mockup interaction

## Monitoring & Analytics

### Key Metrics
- **Mockup Load Success Rate:** % of successful mockup generations
- **User Interaction:** Click-through rates on mockups
- **Carousel Engagement:** Thumbnail navigation usage
- **Purchase Conversion:** Mockup clicks → purchase completion

### Error Tracking
- Printify API failures logged and monitored
- Fallback mockup usage tracked
- Performance metrics for mockup load times

## Future Enhancements

### Planned Improvements
1. **Additional Camera Angles:** Support for multiple context views
2. **Size Visualization:** Dynamic mockup sizing based on selected dimensions
3. **AR Preview:** Augmented reality product visualization
4. **Personalization:** Mockup selection based on user preferences

### Technical Debt
- Mockup caching optimization for faster subsequent loads
- Advanced error recovery for Printify API failures
- Performance monitoring for large mockup datasets

---

## Related Documentation
- [PRODUCTS.md](./PRODUCTS.md) - Complete product specifications and pricing
- [CRITICAL_PATH_USER_FLOW.md](./CRITICAL_PATH_USER_FLOW.md) - User journey documentation
- [PRINTIFY_INTEGRATION.md](./PRINTIFY_INTEGRATION.md) - Printify API integration details
