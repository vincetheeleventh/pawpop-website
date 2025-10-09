# Plausible Analytics Implementation

## Overview

PawPop now includes comprehensive Plausible Analytics integration with A/B testing for price variants. This implementation provides privacy-focused analytics alongside the existing Google Ads conversion tracking.

## Future Enhancements

  ### Planned Features

## Goals & Funnels (Plausible Dashboard)

This implementation already emits all required events. Configure goals and funnels in Plausible to visualize conversion.

### Recommended Goals
- Funnel Step: Upload Modal Opened
- Funnel Step: Email Captured
- Funnel Step: Upload Deferred
- Funnel Step: Deferred Upload Completed
- Funnel Step: Photo Uploaded
- Funnel Step: Artwork Generation Started
- Funnel Step: Artwork Completed
- Funnel Step: Artwork Page Viewed
- Funnel Step: Purchase Modal Opened
- Funnel Step: Checkout Initiated
- Funnel Step: Purchase Completed

### Recommended Funnels
1) Email-First Complete Flow: Upload Modal Opened → Email Captured → Photo Uploaded → Artwork Completed → Purchase Completed
2) Immediate Upload Flow: Email Captured → Photo Uploaded → Artwork Completed
3) Deferred Upload Recovery: Email Captured → Upload Deferred → Deferred Upload Completed → Artwork Completed

### Key Metrics
- Email capture rate = Email Captured / Upload Modal Opened
- Upload Now vs Later split via button_name
- Deferred return rate = Deferred Upload Completed / Upload Deferred
- Overall funnel completion = Purchase Completed / Upload Modal Opened

## Email-First Upload Flow Tracking

The email-first modal introduces additional steps between modal open and photo upload. All events include price variant context and run alongside Clarity.

### New/Updated Events
- Email Captured: form start/complete for the email step
- Upload Now vs Upload Later: button clicks with location=upload-choice
- Deferred Upload: special funnel step (2.6) and completion (2.7)
- Photo Upload: file properties (type, size MB, converted_from_heic)
- Generation Started/Completed: includes performance timings and manual approval labels when applicable
- Error Occurred: rich context for validation and network errors

### Dashboard Filters
- form_name: "Email Capture Form", "Upload Form - Email First"
- button_name: "Upload Now" | "Upload Later"
- price_variant: "A" | "B"
- form_name contains "Pending Approval" (when manual approval is enabled)

## Conclusion
🎯 A/B Testing for Price Variants
- **Persistent Assignment**: Users are assigned to variant A or B and maintain that assignment for 30 days
- **Two Price Points**: 
  - Variant A (Standard): Digital $29, Print $79, Canvas $129
  - Variant B (Premium): Digital $39, Print $89, Canvas $149
- **Automatic Tracking**: All events include price variant context for analysis

### 📊 Comprehensive Event Tracking
- **Funnel Analysis**: 10-step conversion funnel from landing page to purchase
- **Performance Monitoring**: Page load times, API response times, image generation times
- **User Interactions**: Button clicks, form submissions, modal interactions
- **Error Tracking**: Comprehensive error logging with context

### 🔄 Integration with Existing Systems
- **Runs Alongside Google Ads**: Complements existing conversion tracking
- **Dynamic Pricing**: Seamless integration with copy system
- **Component Integration**: Tracking built into key components

## Architecture

### Core Files

```
src/lib/plausible.ts              # Main analytics library
src/hooks/usePlausibleTracking.ts # React hook for tracking
src/components/analytics/PlausibleScript.tsx # Script loader
src/lib/copy.ts                   # Dynamic pricing integration
```

### Price Variant System

```typescript
// Variant configuration
const PRICE_VARIANTS = {
  A: { digital: 29, print: 79, canvas: 129, label: 'Standard Pricing' },
  B: { digital: 39, print: 89, canvas: 149, label: 'Premium Pricing' }
}

// Persistent storage
localStorage: pawpop_price_variant (A|B)
localStorage: pawpop_price_variant_expiry (timestamp)
```

## Implementation Details

### 1. Price Variant Assignment

```typescript
// Automatic 50/50 split assignment
const variant = Math.random() < 0.5 ? 'A' : 'B';

// 30-day persistence
localStorage.setItem('pawpop_price_variant', variant);
localStorage.setItem('pawpop_price_variant_expiry', expiry);

// Tracking
plausible.trackEvent('Price Variant Assigned', {
  variant: variant,
  label: PRICE_VARIANTS[variant].label
});
```

### 2. Dynamic Pricing Integration

```typescript
// Get current variant pricing
const priceConfig = getPriceConfig();

// Update copy system
export function getDynamicPricing() {
  return {
    variant: priceConfig.variant,
    options: [
      { name: 'Digital Portrait', price: `$${priceConfig.digital}` },
      { name: 'Premium Print', price: `$${priceConfig.print}` },
      { name: 'Framed Canvas', price: `$${priceConfig.canvas}` }
    ]
  };
}
```

### 3. Funnel Tracking

```typescript
// 10-step conversion funnel
const trackFunnel = {
  landingPageView: () => trackFunnelStep('Landing Page View', 1),
  uploadModalOpened: () => trackFunnelStep('Upload Modal Opened', 2),
  photoUploaded: (size, type) => trackFunnelStep('Photo Uploaded', 3),
  artworkGenerationStarted: () => trackFunnelStep('Artwork Generation Started', 4),
  artworkCompleted: (time) => trackFunnelStep('Artwork Completed', 5),
  artworkPageViewed: (id) => trackFunnelStep('Artwork Page Viewed', 6),
  purchaseModalOpened: (type) => trackFunnelStep('Purchase Modal Opened', 7),
  productSelected: (type, price) => trackFunnelStep('Product Selected', 8),
  checkoutInitiated: (type, price) => trackFunnelStep('Checkout Initiated', 9),
  purchaseCompleted: (type, price, id) => trackFunnelStep('Purchase Completed', 10)
};
```

### 4. Component Integration

```typescript
// UploadModal.tsx
const { trackFunnel, trackInteraction } = usePlausibleTracking();

useEffect(() => {
  if (isOpen) {
    trackFunnel.uploadModalOpened();
    trackInteraction.modalOpen('Upload Modal');
  }
}, [isOpen]);

// ProductPurchaseModal.tsx
const { trackPriceExposure, getPriceConfig } = usePlausibleTracking();
const currentPrice = getCurrentPrice();

useEffect(() => {
  if (isOpen) {
    trackPriceExposure('Purchase Modal', productType, currentPrice);
  }
}, [isOpen]);
```

## Event Schema

### Standard Event Properties
All events automatically include:
```typescript
{
  price_variant: 'A' | 'B',
  variant_label: 'Standard Pricing' | 'Premium Pricing'
}
```

### Funnel Events
```typescript
{
  step: string,
  step_number: number,
  // Additional context...
}
```

### Revenue Events
```typescript
{
  amount: number,
  currency: 'USD',
  conversion_type: string,
  digital_price: number,
  print_price: number,
  canvas_price: number
}
```

### Performance Events
```typescript
{
  load_time_ms?: number,
  response_time_ms?: number,
  generation_time_seconds?: number,
  success: boolean
}
```

## Configuration

### Environment Variables

```bash
# Required
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=pawpopart.com

# Optional
NEXT_PUBLIC_PLAUSIBLE_SRC=https://plausible.io/js/script.js
```

### Layout Integration

```tsx
// src/app/layout.tsx
import PlausibleScript from '@/components/analytics/PlausibleScript';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <GoogleAdsTracking />
        <PlausibleScript />
        {children}
      </body>
    </html>
  );
}
```

## Testing

### Test Suite Coverage

```bash
# Run all Plausible tests
npm run test:plausible

# Watch mode
npm run test:plausible-watch
```

**Test Files:**
- `tests/lib/plausible.test.ts` - Core library functionality (45 tests)
- `tests/hooks/usePlausibleTracking.test.tsx` - React hook testing (25 tests)
- `tests/integration/plausible-ab-testing.test.ts` - A/B testing integration (15 tests)

### Test Utilities

```typescript
import { plausibleTestUtils } from '@/lib/plausible';

// Force specific variant for testing
plausibleTestUtils.forceVariant('A');

// Clear variant assignment
plausibleTestUtils.clearVariant();

// Get analytics summary
const summary = plausibleTestUtils.getAnalyticsSummary();
```

## Analytics Dashboard

### Key Metrics to Track

**Conversion Funnel:**
1. Landing Page Views
2. Upload Modal Opens
3. Photo Uploads
4. Artwork Generation Starts
5. Artwork Completions
6. Artwork Page Views
7. Purchase Modal Opens
8. Product Selections
9. Checkout Initiations
10. Purchase Completions

**A/B Test Analysis:**
- Conversion rates by variant
- Revenue per variant
- Average order value by variant
- Statistical significance testing

**Performance Metrics:**
- Page load times
- API response times
- Image generation times
- Error rates

### Custom Events for Analysis

```javascript
// Plausible dashboard custom events
'Price Variant Assigned'
'Variant Exposure'
'Funnel Step'
'Conversion: Purchase'
'Button Click'
'Form Completed'
'Error Occurred'
'Page Load Performance'
'API Performance'
'Image Generation Performance'
```

## Production Deployment

### 1. Environment Setup

```bash
# Add to production .env.local
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=pawpopart.com
```

### 2. Plausible Dashboard Setup

1. Create account at plausible.io
2. Add domain: pawpopart.com
3. Configure custom events
4. Set up goals for conversions

### 3. Verification

```typescript
// Check analytics summary
console.log(plausibleTestUtils.getAnalyticsSummary());

// Verify tracking
plausible.trackEvent('Test Event', { test: true });
```

## Best Practices

### 1. Event Naming
- Use consistent naming conventions
- Include context in event names
- Group related events with prefixes

### 2. Property Structure
- Keep property names consistent
- Use snake_case for properties
- Include variant context in all events

### 3. Performance
- Track performance metrics
- Monitor error rates
- Use non-blocking tracking calls

### 4. Privacy
- No personal data in events
- Respect user privacy preferences
- Use aggregated data for analysis

## Troubleshooting

### Common Issues

**1. Variant Not Persisting**
```typescript
// Check localStorage
console.log(localStorage.getItem('pawpop_price_variant'));
console.log(localStorage.getItem('pawpop_price_variant_expiry'));
```

**2. Events Not Tracking**
```typescript
// Verify Plausible script loaded
console.log(window.plausible);

// Check domain configuration
console.log(process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN);
```

**3. Price Variants Not Working**
```typescript
// Test variant assignment
plausibleTestUtils.forceVariant('A');
console.log(getDynamicPricing());
```

### Debug Mode

```typescript
// Enable debug logging
localStorage.setItem('plausible_debug', 'true');

// View analytics summary

## Conclusion

The Plausible Analytics implementation provides comprehensive, privacy-focused analytics with sophisticated A/B testing capabilities. The system is production-ready, thoroughly tested, and designed to scale with PawPop's growth.

**Key Benefits:**
- ✅ Privacy-focused analytics
- ✅ Comprehensive funnel analysis
- ✅ Easy configuration and deployment
- ✅ Extensive test coverage
- ✅ Integration with existing systems

The implementation enables data-driven decision making while respecting user privacy and providing actionable insights for business optimization.
