# Hotjar Analytics Integration

## Overview

Hotjar is integrated into PawPop to provide behavioral analytics including heatmaps, session recordings, conversion funnels, and user feedback. This complements existing Plausible Analytics (privacy-focused metrics) and Google Ads tracking (conversion optimization).

## Features Implemented

### 1. **Session Recordings**
- Watch real user journeys through the site
- Identify friction points and UX issues
- Debug user-reported problems

### 2. **Heatmaps**
- Click maps: See where users click
- Move maps: Track mouse movement patterns
- Scroll maps: Understand content engagement

### 3. **Conversion Funnels**
- Visual funnel analysis from landing to purchase
- Identify drop-off points in user flows
- Optimize conversion rates

### 4. **Feedback & Surveys**
- On-page feedback widgets
- Targeted survey triggers
- User sentiment analysis

## Technical Implementation

### Core Files

```
/src/components/analytics/HotjarScript.tsx  - Script loader component
/src/lib/hotjar.ts                          - Helper functions and tracking API
```

### Integration Points

**1. Layout (Global)**
```typescript
// src/app/layout.tsx
import HotjarScript from '@/components/analytics/HotjarScript';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <HotjarScript />
        {children}
      </body>
    </html>
  );
}
```

**2. Landing Page**
```typescript
// src/components/landing/HeroSection.tsx
import { hotjar } from '@/lib/hotjar';

useEffect(() => {
  hotjar.landingPage.viewed();
}, []);

const handleCTAClick = () => {
  hotjar.landingPage.ctaClicked();
  // ... rest of click handler
};
```

**3. Upload Flow**
```typescript
// src/components/forms/UploadModal.tsx
import { hotjar } from '@/lib/hotjar';

// Modal opened
useEffect(() => {
  if (isOpen) {
    hotjar.upload.modalOpened();
  }
}, [isOpen]);

// Photo uploaded
const handleFileUpload = async (file) => {
  // ... upload logic
  hotjar.upload.photoUploaded();
};

// Form submitted
const handleSubmit = async () => {
  hotjar.upload.formSubmitted();
  // ... submission logic
};

// Error tracking
catch (error) {
  hotjar.upload.error(errorType);
}
```

**4. Artwork Page**
```typescript
// src/app/artwork/[token]/page.tsx
import { hotjar } from '@/lib/hotjar';

useEffect(() => {
  hotjar.artwork.pageViewed();
}, []);

const handleCTAClick = () => {
  hotjar.artwork.ctaClicked();
};
```

**5. Purchase Flow**
```typescript
// src/components/modals/ProductPurchaseModal.tsx
import { hotjar } from '@/lib/hotjar';

useEffect(() => {
  if (isOpen) {
    hotjar.purchase.modalOpened();
    hotjar.purchase.productSelected(productType);
  }
}, [isOpen, productType]);

const handlePurchase = async () => {
  hotjar.purchase.checkoutStarted();
  // ... checkout logic
};
```

## Event Tracking

### Landing Page Events
- `landing_page_viewed` - Page load
- `landing_cta_clicked` - Primary CTA click
- `why_pawpop_opened` - Why section opened

### Upload Flow Events
- `upload_modal_opened` - Upload modal opened
- `photo_uploaded` - Photo successfully uploaded
- `upload_form_submitted` - Form submitted
- `generation_started` - Artwork generation started
- `generation_completed` - Artwork generation finished
- `upload_error_[type]` - Error occurred

### Artwork Page Events
- `artwork_page_viewed` - Artwork page loaded
- `artwork_image_loaded` - Image fully loaded
- `artwork_cta_clicked` - "Make it Real" CTA clicked

### Purchase Flow Events
- `purchase_modal_opened` - Purchase modal opened
- `product_selected_[type]` - Product type selected
- `checkout_started` - Checkout initiated
- `checkout_completed` - Purchase completed
- `checkout_error` - Checkout error occurred

## User Attributes

Track user context for better segmentation:

```typescript
hotjar.setUser({
  priceVariant: 'A',              // A/B test variant
  customerEmail: 'user@example.com',
  hasCompletedGeneration: true,
  hasPurchased: false
});
```

## Session Tagging

Tag sessions for filtering in Hotjar dashboard:

```typescript
// Tag high-value users
hotjar.tagSession(['high_value', 'returning_customer']);

// Tag specific flows
hotjar.tagSession(['digital_product', 'express_shipping']);

// Tag error states
hotjar.tagSession(['checkout_error', 'payment_failed']);
```

## Environment Configuration

### Required Variables

```env
# .env.local
NEXT_PUBLIC_HOTJAR_ID=your_hotjar_site_id
NEXT_PUBLIC_HOTJAR_SNIPPET_VERSION=6
```

### Getting Your Hotjar ID

1. Sign up at [hotjar.com](https://www.hotjar.com)
2. Create a new site in your Hotjar dashboard
3. Copy your Site ID (numeric value)
4. Add to `.env.local`

### Development vs Production

Hotjar will load in all environments where `NEXT_PUBLIC_HOTJAR_ID` is set. To disable:

```env
# Disable Hotjar
# NEXT_PUBLIC_HOTJAR_ID=
```

## Privacy & GDPR Compliance

### Suppressing Sensitive Data

Hotjar automatically suppresses password fields. For additional sensitive content:

```html
<!-- Suppress text content -->
<div className="data-hj-suppress">
  {customerEmail}
</div>

<!-- Mask input values -->
<input
  type="text"
  className="data-hj-suppress"
  value={customerName}
/>
```

### User Consent

If required by your privacy policy, implement consent:

```typescript
// Only load Hotjar after consent
if (userHasConsented) {
  // Hotjar will load automatically
} else {
  // Don't set NEXT_PUBLIC_HOTJAR_ID or implement dynamic loading
}
```

### IP Address Anonymization

Configure in Hotjar dashboard:
1. Go to Settings → Privacy
2. Enable "Suppress IP addresses"
3. Enable "Do Not Track"

## Usage & Best Practices

### 1. Focus on Key Pages

**High Priority:**
- Landing page (conversion optimization)
- Upload modal (friction points)
- Artwork page (engagement analysis)
- Checkout flow (cart abandonment)

**Low Priority:**
- Admin pages
- Internal tools
- Success/thank you pages

### 2. Session Recording Filters

Create targeted recordings:

```typescript
// High-value user flows
if (orderValue > 100) {
  hotjar.tagSession(['high_value_order']);
}

// Error tracking
if (errorOccurred) {
  hotjar.tagSession(['error', errorType]);
}

// A/B test variants
hotjar.setUser({
  priceVariant: getPriceVariant()
});
```

### 3. Heatmap Analysis

**Recommended Heatmaps:**
- Hero CTA button performance
- Upload modal interaction patterns
- Artwork page scroll depth
- Purchase modal element clicks

### 4. Conversion Funnel Setup

Create funnels in Hotjar dashboard:

**Main Funnel:**
1. Landing Page → `landing_page_viewed`
2. Upload Modal → `upload_modal_opened`
3. Form Submit → `upload_form_submitted`
4. Artwork Page → `artwork_page_viewed`
5. Purchase Modal → `purchase_modal_opened`
6. Checkout → `checkout_started`

### 5. Feedback Widgets

Trigger surveys at key moments:

```typescript
// After artwork generation
if (generationComplete) {
  hotjar.triggerSurvey('artwork_satisfaction');
}

// After purchase
if (purchaseComplete) {
  hotjar.triggerSurvey('post_purchase_nps');
}
```

## Analytics Stack Integration

### Hotjar + Plausible + Google Ads

**Complementary Use Cases:**

| Tool | Purpose | Use For |
|------|---------|---------|
| **Hotjar** | Behavioral analytics | UX optimization, identifying friction |
| **Plausible** | Privacy-focused metrics | Traffic analysis, A/B testing |
| **Google Ads** | Conversion tracking | Ad campaign optimization, ROI |

**Example Workflow:**
1. **Google Ads**: Shows which campaigns drive traffic
2. **Plausible**: Shows where users drop off (funnel metrics)
3. **Hotjar**: Shows *why* they drop off (recordings/heatmaps)

### Data Synchronization

User attributes are consistent across platforms:

```typescript
// Set user context for all platforms
const variant = plausible.getPriceVariant();
hotjar.setUser({ priceVariant: variant });
```

## Troubleshooting

### Hotjar Not Loading

**Check:**
1. `NEXT_PUBLIC_HOTJAR_ID` is set correctly
2. Site ID matches Hotjar dashboard
3. Browser console for script errors
4. Ad blockers aren't blocking Hotjar

```bash
# Verify environment variable
echo $NEXT_PUBLIC_HOTJAR_ID
```

### Events Not Tracking

**Verify:**
1. Hotjar script loaded: `window.hj` exists
2. Events triggering: Check browser console logs
3. Event names match dashboard configuration

```typescript
// Debug event tracking
if (hotjar.isAvailable()) {
  console.log('Hotjar is active');
} else {
  console.warn('Hotjar not available');
}
```

### Session Recordings Missing

**Common Issues:**
1. Daily session limit reached (free tier: 35 sessions/day)
2. Do Not Track enabled in user's browser
3. Ad blockers blocking Hotjar
4. Session recording disabled in settings

## Performance Impact

### Script Loading

- **Strategy**: `afterInteractive` (loads after page interactive)
- **Impact**: Minimal (~20kb gzipped)
- **Non-blocking**: Won't delay page rendering

### Best Practices

1. **Lazy load on interaction:**
```typescript
// Only load after user action
const loadHotjar = () => {
  if (!window.hj) {
    // Load Hotjar dynamically
  }
};
```

2. **Conditional loading:**
```typescript
// Only on specific pages
if (shouldTrackPage) {
  hotjar.landingPage.viewed();
}
```

## Monitoring & Alerts

### Key Metrics to Monitor

1. **Daily session count** (free tier: 35/day)
2. **Recording storage** (30-day retention)
3. **Heatmap data collection** (pageview count)

### Dashboard Setup

**Recommended Dashboard:**
1. Conversion funnel (main flow)
2. Heatmaps (landing, artwork, checkout)
3. Session recordings (filtered by tags)
4. Feedback responses

## Production Deployment

### Pre-Launch Checklist

- [ ] Hotjar account created
- [ ] Site ID obtained
- [ ] Environment variables set in Vercel
- [ ] Privacy policy updated (if required)
- [ ] IP anonymization enabled
- [ ] Session recording filters configured
- [ ] Conversion funnels created
- [ ] Heatmaps configured for key pages

### Vercel Configuration

```bash
# Add to Vercel environment variables
vercel env add NEXT_PUBLIC_HOTJAR_ID production
```

### Testing in Production

1. Visit site and perform test actions
2. Check Hotjar dashboard (data updates in ~1 minute)
3. Verify events are tracked correctly
4. Review session recordings for accuracy

## Support & Resources

- **Hotjar Documentation**: https://help.hotjar.com
- **API Reference**: https://help.hotjar.com/hc/en-us/articles/115011639887
- **Community**: https://community.hotjar.com

## Summary

Hotjar provides behavioral insights that complement PawPop's existing analytics stack:

✅ **Session Recordings** - Watch real user journeys  
✅ **Heatmaps** - Visualize interaction patterns  
✅ **Conversion Funnels** - Identify drop-off points  
✅ **Feedback Widgets** - Collect user sentiment  
✅ **Privacy-First** - GDPR compliant with data suppression  
✅ **Performance Optimized** - Non-blocking script loading  

**Result**: Data-driven UX optimization and conversion rate improvements.
