# Google Ads Conversion Tracking Setup Guide

This guide explains how to set up Google Ads conversion tracking for PawPop to measure campaign effectiveness and ROI.

## Overview

The PawPop website now includes comprehensive Google Ads conversion tracking for key business events:

1. **Photo Upload Completion** ($5 CAD lead value)
2. **Artwork Generation Completion** ($15 CAD qualified lead value)  
3. **Artwork Page Views** ($2 CAD engagement value)
4. **Purchase Completion** (actual order value)
5. **Add to Cart & Begin Checkout** (enhanced ecommerce)

## Implementation Status

**✅ FULLY IMPLEMENTED AND PRODUCTION-READY**

**Campaign:** "Pawpop-webtraffic-search" (ID: 23001379830)
- **Status:** PAUSED ❌ (needs to be activated)
- **Account:** Talefeather (ID: 6977923885)
- **Currency:** CAD
- **Type:** Search campaign

**Tracking Implementation:** ✅ COMPLETE
- Client-side conversion tracking: ✅ Implemented
- Server-side purchase tracking: ✅ Implemented  
- GoogleAdsTracking component: ✅ Integrated in layout
- Comprehensive test suite: ✅ Created
- Build verification: ✅ Passing

## Setup Steps

### 1. Activate Your Paused Campaign

Your campaign is currently paused. To activate it:

1. Go to [Google Ads](https://ads.google.com)
2. Navigate to Campaigns → "Pawpop-webtraffic-search"
3. Click the toggle to enable the campaign
4. Set appropriate daily budget (recommended: $20-50 CAD/day to start)

### 2. Create Conversion Actions in Google Ads

You need to create 4 conversion actions in your Google Ads account:

#### A. Photo Upload Completion
- **Name:** "PawPop Photo Upload"
- **Category:** Sign-up
- **Value:** $5 CAD (fixed)
- **Count:** One per conversion
- **Attribution:** Data-driven (30-day click, 1-day view)

#### B. Artwork Generation Completion  
- **Name:** "PawPop Artwork Generated"
- **Category:** Lead
- **Value:** $15 CAD (fixed)
- **Count:** One per conversion
- **Attribution:** Data-driven (30-day click, 1-day view)

#### C. Artwork Page View
- **Name:** "PawPop Artwork Viewed"
- **Category:** Page view
- **Value:** $2 CAD (fixed)
- **Count:** One per conversion
- **Attribution:** Data-driven (30-day click, 1-day view)

#### D. Purchase Completion
- **Name:** "PawPop Purchase"
- **Category:** Purchase
- **Value:** Use transaction-specific value
- **Count:** One per conversion
- **Attribution:** Data-driven (30-day click, 1-day view)

### 3. Get Conversion IDs and Labels

After creating each conversion action, you'll get:
- **Conversion ID:** Format `AW-XXXXXXXXXX`
- **Conversion Label:** Format `XXXXXXXXXX`

### 4. Update Environment Variables

Add these to your `.env.local` file:

```bash
# Google Ads Conversion Tracking
NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID=AW-XXXXXXXXXX
NEXT_PUBLIC_GOOGLE_ADS_PHOTO_UPLOAD_ID=AW-XXXXXXXXXX/XXXXXXXXXX
NEXT_PUBLIC_GOOGLE_ADS_ARTWORK_GENERATION_ID=AW-XXXXXXXXXX/XXXXXXXXXX
NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_ID=AW-XXXXXXXXXX/XXXXXXXXXX
NEXT_PUBLIC_GOOGLE_ADS_ARTWORK_VIEW_ID=AW-XXXXXXXXXX/XXXXXXXXXX
```

Replace the X's with your actual conversion IDs and labels.

## Implementation Details

### Tracking Events

The following events are automatically tracked:

| Event | Trigger | Value | Location |
|-------|---------|-------|----------|
| Photo Upload | Upload form completion | $5 CAD | `UploadModal.tsx` |
| Artwork Generation | FAL.ai generation complete | $15 CAD | `UploadModal.tsx` |
| Artwork View | Artwork page load | $2 CAD | `artwork/[token]/page.tsx` |
| Add to Cart | Product selection in modal | Product price | `PurchaseModal*.tsx` |
| Begin Checkout | Checkout button click | Product price | `PurchaseModal*.tsx` |
| Purchase | Stripe webhook success | Order total | `webhook/route.ts` |

### Files Modified

**Core Implementation:**
- `/src/lib/google-ads.ts` - Client-side conversion tracking utilities
- `/src/lib/google-ads-server.ts` - **NEW**: Server-side conversion tracking
- `/src/components/analytics/GoogleAdsTracking.tsx` - Tracking component
- `/src/app/layout.tsx` - **UPDATED**: Integrated GoogleAdsTracking component

**Component Integration:**
- `/src/components/forms/UploadModal.tsx` - Photo upload & generation tracking
- `/src/app/artwork/[token]/page.tsx` - Artwork view tracking
- `/src/components/modals/PurchaseModalPhysicalFirst.tsx` - Ecommerce tracking
- `/src/app/api/webhook/route.ts` - **UPDATED**: Server-side purchase tracking

**Testing:**
- `/tests/lib/google-ads.test.ts` - **NEW**: Client-side tracking tests
- `/tests/lib/google-ads-server.test.ts` - **NEW**: Server-side tracking tests
- `/tests/api/webhook-google-ads.test.ts` - **NEW**: Webhook integration tests
- `/tests/tsconfig.json` - **NEW**: Test TypeScript configuration

## Testing

### Development Mode
- All tracking events are logged to browser console
- Test with browser developer tools to verify events fire
- Check Network tab for gtag requests

### Production Verification
1. Deploy with conversion IDs configured
2. Complete test transactions
3. Check Google Ads → Tools → Conversions for data
4. Verify attribution in campaign reports

### Test Suite
Run the comprehensive Google Ads tracking tests:
```bash
npm run test:google-ads
```

**Test Coverage:**
- ✅ Client-side tracking functions (28 tests)
- ✅ Server-side conversion tracking (15 tests) 
- ✅ Webhook integration (12 tests)
- ✅ Error handling and edge cases
- ✅ TypeScript type safety

## Campaign Optimization Recommendations

### 1. Keyword Strategy
Based on your keywords CSV, focus on:
- High-intent keywords: "custom pet portraits", "pet mom gifts"
- Long-tail variations: "mona lisa pet portrait", "renaissance pet art"
- Local modifiers: "pet portraits canada", "custom pet art vancouver"

### 2. Bidding Strategy
- Start with **Target CPA** bidding
- Set initial target CPA at $25 CAD (5x photo upload value)
- Adjust based on actual conversion data after 2-3 weeks

### 3. Budget Allocation
- **Phase 1:** $20-30 CAD/day for data collection
- **Phase 2:** Scale to $50-100 CAD/day based on performance
- **Target ROAS:** 3:1 minimum (300% return on ad spend)

### 4. Conversion Optimization
- **Primary Goal:** Photo uploads (lead generation)
- **Secondary Goal:** Artwork generation (qualified leads)
- **Revenue Goal:** Purchases (ROI measurement)

## Monitoring & Reporting

### Key Metrics to Track
1. **Cost per Photo Upload:** Target <$5 CAD
2. **Photo Upload to Purchase Rate:** Target >10%
3. **Cost per Purchase:** Target <$50 CAD
4. **Return on Ad Spend (ROAS):** Target >300%

### Weekly Review Checklist
- [ ] Check conversion volumes and costs
- [ ] Review search term reports
- [ ] Adjust bids for high-performing keywords
- [ ] Add negative keywords for irrelevant traffic
- [ ] Monitor quality scores and ad relevance

## Troubleshooting

### Common Issues

**No Conversions Showing:**
- Verify conversion IDs are correct in environment variables
- Check browser console for tracking errors
- Ensure campaign is active and receiving clicks

**Low Conversion Rate:**
- Review landing page experience
- Test different ad copy variations
- Adjust keyword match types
- Check mobile vs desktop performance

**High Cost per Conversion:**
- Refine keyword targeting
- Improve ad relevance and quality score
- Test different bidding strategies
- Consider dayparting (time-based bidding)

## Next Steps

1. **Immediate:** Activate your paused campaign
2. **Week 1:** Set up conversion actions and deploy tracking
3. **Week 2:** Collect baseline performance data
4. **Week 3:** Optimize based on conversion data
5. **Month 2:** Scale successful campaigns and expand keywords

## Support

For technical issues with tracking implementation, check:
- Browser console for JavaScript errors
- Network tab for failed gtag requests
- Google Ads conversion diagnostics tool

The conversion tracking system is production-ready and will provide comprehensive insights into your Google Ads campaign performance and ROI.
