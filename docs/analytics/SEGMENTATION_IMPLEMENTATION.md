# Segmentation Implementation

## User Type Tracking (Gifter vs Self-Purchaser)

Status: Implemented  
Source doc archived: `../.archive/USER_TYPE_TRACKING.md`

### Overview
Tracks whether a user is a gifter or self-purchaser to enable segmented analytics, pricing insights, and marketing optimization.

- Values: `gifter` | `self_purchaser`
- Captured at email capture step via friendly toggle
- Sent to:
  - Plausible (custom event properties)
  - Microsoft Clarity (session tags)
  - Google Ads (value differentiation on photo upload)

### Analytics Integration
- Plausible event example:
```ts
trackEvent('Email Captured', {
  user_type: 'gifter' | 'self_purchaser',
  is_gift: boolean,
  price_variant: 'A' | 'B'
});
```
- Clarity tags example:
```ts
clarity.setTag('user_type', 'gifter');
clarity.setTag('is_gift', true);
```

### Database
- Column: `artworks.user_type` (`'gifter' | 'self_purchaser'`)
- Indexed for BI queries

### BI Queries (examples)
- Conversion rate by user type
- Revenue by user type
- Deferred upload rate by user type

### Deployment Checklist
- Apply migration for `user_type` column
- Deploy UI toggle in email capture
- Verify Plausible/Clarity properties present
- Validate Google Ads value differentiation

### Files
- UI: `src/components/forms/UploadModalEmailFirst.tsx`
- Types: `src/lib/supabase.ts`
- Migration: `supabase/migrations/020_add_user_type_tracking.sql`
- Tests: `tests/components/UploadModalEmailFirst-usertype.test.tsx`
