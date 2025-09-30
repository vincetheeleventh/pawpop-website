# User Type Tracking: Gifter vs Self-Purchaser

**Status**: ✅ Implemented  
**Date**: 2025-09-30  
**Feature**: Analytics tracking to differentiate between users buying gifts vs buying for themselves

## Overview

PawPop now tracks whether users are creating artwork as a **gift** or for **themselves**. This user type differentiation enables:

- **Conversion analysis** by user segment
- **Targeted marketing** based on purchase intent
- **Product optimization** for different use cases
- **Ad spend optimization** with higher valuations for gift buyers

## User Experience

### Frictionless Email Capture

The email capture step has been simplified to remove friction:

**✅ What We Collect:**
- Email address (required)
- Gift intention (optional toggle)

**❌ What We Removed:**
- Name field (collected later if needed)
- Additional form fields
- Extra steps

### Gift Toggle

Users see a simple, friendly toggle:

```
🎁 Is this a gift?
   Help us personalize your experience
   [Toggle: OFF/ON]
```

- **Default**: OFF (self-purchaser)
- **Location**: Below email input
- **Design**: Atomic tangerine when active, gray when inactive
- **Copy**: Non-intrusive, helpful tone

## Analytics Implementation

### User Type Values

```typescript
type UserType = 'gifter' | 'self_purchaser'
```

- **gifter**: User selected "Yes" on gift toggle
- **self_purchaser**: User did not select gift toggle (default)

### Tracking Platforms

#### 1. Plausible Analytics

**Custom Event**: `Email Captured`
```javascript
trackEvent('Email Captured', {
  user_type: 'gifter' | 'self_purchaser',
  is_gift: true | false,
  price_variant: 'A' | 'B'  // Existing A/B test
});
```

**Benefits**:
- Privacy-focused
- No PII exposure
- Conversion funnel by user type
- Revenue attribution by segment

#### 2. Microsoft Clarity

**Session Tags**:
```javascript
clarity.setTag('user_type', 'gifter');
clarity.setTag('is_gift', true);
```

**Benefits**:
- Session recording filtered by user type
- Heatmaps segmented by gifter vs self-purchaser
- Behavior analysis by segment

#### 3. Google Ads

**Enhanced Conversions with Value Differentiation**:
```javascript
// Gifters: $3 CAD (higher purchase intent)
trackPhotoUpload(3, { email: userEmail });

// Self-purchasers: $2 CAD (standard)
trackPhotoUpload(2, { email: userEmail });
```

**Rationale**:
- Gifters typically have **higher purchase intent** (special occasion)
- Gifters are **less price-sensitive** (emotional purchase)
- 50% value uplift reflects conversion probability difference

### Database Storage

**Table**: `artworks`  
**Column**: `user_type TEXT CHECK (user_type IN ('gifter', 'self_purchaser'))`

```sql
CREATE INDEX idx_artworks_user_type ON artworks(user_type);
```

**Analytics View**:
```sql
SELECT 
  user_type,
  COUNT(*) as total_artworks,
  COUNT(CASE WHEN generation_step = 'completed' THEN 1 END) as completed_artworks,
  ROUND(
    COUNT(CASE WHEN generation_step = 'completed' THEN 1 END)::numeric / 
    NULLIF(COUNT(*), 0) * 100, 
    2
  ) as completion_rate_percent
FROM artworks
WHERE user_type IS NOT NULL
GROUP BY user_type;
```

## Business Intelligence Queries

### Conversion Rate by User Type

```sql
SELECT 
  user_type,
  COUNT(*) as total_users,
  COUNT(CASE WHEN generation_step = 'completed' THEN 1 END) as conversions,
  ROUND(
    COUNT(CASE WHEN generation_step = 'completed' THEN 1 END)::numeric /
    NULLIF(COUNT(*), 0) * 100, 
    2
  ) as conversion_rate_percent
FROM artworks
WHERE user_type IS NOT NULL
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY user_type;
```

### Revenue by User Type

```sql
SELECT 
  a.user_type,
  COUNT(DISTINCT o.id) as total_orders,
  SUM(o.price_cents) / 100.0 as total_revenue_cad,
  AVG(o.price_cents) / 100.0 as avg_order_value_cad
FROM artworks a
JOIN orders o ON a.id = o.artwork_id
WHERE a.user_type IS NOT NULL
  AND o.order_status = 'paid'
  AND o.created_at >= NOW() - INTERVAL '30 days'
GROUP BY a.user_type;
```

### Deferred Upload Rate by User Type

```sql
SELECT 
  user_type,
  COUNT(*) as total_users,
  COUNT(CASE WHEN upload_deferred = true THEN 1 END) as deferred_uploads,
  ROUND(
    COUNT(CASE WHEN upload_deferred = true THEN 1 END)::numeric /
    NULLIF(COUNT(*), 0) * 100,
    2
  ) as deferral_rate_percent
FROM artworks
WHERE user_type IS NOT NULL
  AND email_captured_at >= NOW() - INTERVAL '30 days'
GROUP BY user_type;
```

## Key Insights to Track

### Hypothesis Testing

1. **Purchase Intent**: Do gifters have higher conversion rates?
2. **Price Sensitivity**: Are gifters less affected by A/B price testing?
3. **Cart Abandonment**: Do gifters have lower abandonment rates?
4. **Product Mix**: Do gifters prefer higher-end products (framed canvas vs digital)?
5. **Urgency**: Do gifters complete artwork generation faster?

### Expected Patterns

Based on gift-giving psychology research:

| Metric | Gifters | Self-Purchasers | Expected Difference |
|--------|---------|-----------------|---------------------|
| Conversion Rate | Higher | Baseline | +15-30% |
| Avg Order Value | Higher | Baseline | +20-40% |
| Price Sensitivity | Lower | Baseline | Less affected by A/B test |
| Time to Purchase | Faster | Baseline | Deadline-driven |
| Product Choice | Premium | Mixed | More framed canvas |

## Technical Implementation

### Files Modified

- `/src/components/forms/UploadModalEmailFirst.tsx` - Gift toggle UI
- `/src/lib/supabase.ts` - TypeScript interface
- `/supabase/migrations/020_add_user_type_tracking.sql` - Database schema
- `/supabase/rollbacks/020_rollback_add_user_type_tracking.sql` - Rollback

### Files Created

- `/tests/components/UploadModalEmailFirst-usertype.test.tsx` - Test suite
- `/docs/analytics/USER_TYPE_TRACKING.md` - This document

### Migration

**Apply Migration**:
```bash
# Via Supabase Dashboard SQL Editor
-- Copy contents of supabase/migrations/020_add_user_type_tracking.sql
```

**Rollback** (if needed):
```bash
# Via Supabase Dashboard SQL Editor
-- Copy contents of supabase/rollbacks/020_rollback_add_user_type_tracking.sql
```

### Testing

Run test suite:
```bash
npm test tests/components/UploadModalEmailFirst-usertype.test.tsx
```

**Test Coverage**:
- ✅ Gift toggle rendering
- ✅ Toggle interaction
- ✅ Analytics event tracking (Plausible, Clarity)
- ✅ Google Ads conversion value differentiation
- ✅ Database payload validation
- ✅ Form validation
- ✅ UX improvements (autofocus)

## Deployment Checklist

### Pre-Deploy

- [x] Remove name field from email capture
- [x] Add gift toggle UI
- [x] Implement analytics tracking
- [x] Create database migration
- [x] Write comprehensive tests
- [x] Document feature

### Deploy Steps

1. **Apply Database Migration**
   - Copy `020_add_user_type_tracking.sql` to Supabase Dashboard
   - Verify `user_type` column exists
   - Check analytics view works

2. **Deploy Code**
   - Merge feature branch
   - Deploy to production (Vercel)
   - Verify no TypeScript errors

3. **Verify Tracking**
   - Test email capture flow
   - Check Plausible events in dashboard
   - Verify Google Ads conversions
   - Check Clarity session tags

### Post-Deploy Monitoring

**Week 1**:
- Monitor user_type data collection rate
- Check for NULL values (should be minimal)
- Verify analytics platforms receiving data
- Review conversion values in Google Ads

**Month 1**:
- Analyze conversion rate by user type
- Compare revenue metrics
- Assess A/B test interaction
- Optimize Google Ads bidding strategy

## Privacy & Compliance

- ✅ **No PII**: User type is behavioral, not personally identifiable
- ✅ **Optional**: Gift toggle is not required
- ✅ **Transparent**: Clear copy explains why we ask
- ✅ **GDPR Compliant**: No sensitive data collection
- ✅ **Revocable**: Users can change selection (if they go back)

## Future Enhancements

### Phase 2 (Optional)

- **Gift messaging**: Allow gifters to add custom message
- **Recipient details**: Collect recipient name for gifters
- **Gift wrap option**: Premium packaging for gift purchases
- **Delivery scheduling**: Choose delivery date for gifts
- **Gift receipt**: Don't show prices in email to recipient

### Advanced Analytics

- **Seasonal patterns**: Gift purchases around holidays
- **Product recommendations**: Suggest products based on user type
- **Email segmentation**: Different messaging for gifters
- **Remarketing**: Target gifters with gift-focused ads

## Support & Troubleshooting

### Common Issues

**User type not being tracked**:
- Check console for JavaScript errors
- Verify analytics hooks are loaded
- Check database column exists

**Analytics not showing user type**:
- Verify Plausible/Clarity integration
- Check event names match exactly
- Review custom event configuration

**Google Ads not differentiating value**:
- Verify conversion value in console logs
- Check enhanced conversions enabled
- Review Google Ads dashboard for custom parameters

## Summary

The user type tracking feature provides critical insights into gift-giving behavior vs self-purchase patterns. By differentiating these user segments, PawPop can:

1. **Optimize ad spend** with higher valuations for high-intent users
2. **Personalize experiences** based on purchase context
3. **Improve conversion rates** through targeted messaging
4. **Increase revenue** by understanding product preferences

**Implementation**: ✅ Complete  
**Testing**: ✅ Comprehensive  
**Documentation**: ✅ Done  
**Ready for Production**: ✅ Yes
