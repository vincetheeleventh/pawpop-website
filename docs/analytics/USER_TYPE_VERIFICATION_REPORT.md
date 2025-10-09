# ✅ User Type Custom Variable Verification Report

## Summary
**Status**: ✅ **VERIFIED - Your codebase IS sending `user_type` data to Google Ads**

## Complete Data Flow

### 1. **User Captures User Type** ✅
**File**: `/src/components/forms/UploadModalEmailFirst.tsx` (Line 147)

```typescript
const userType = formData.isGift ? 'gifter' : 'self_purchaser';
```

**What happens:**
- User selects "This is a gift" → `userType = 'gifter'`
- User selects "For myself" → `userType = 'self_purchaser'`

---

### 2. **Saved to Database** ✅
**File**: `/src/components/forms/UploadModalEmailFirst.tsx` (Lines 179-189)

```typescript
const createResponse = await fetch('/api/artwork/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    customer_email: formData.email,
    email_captured_at: new Date().toISOString(),
    user_type: userType // ← Saved to database
  }),
});
```

**Database field**: `artworks.user_type` (gifter | self_purchaser)

---

### 3. **Retrieved During Purchase** ✅
**File**: `/src/app/api/webhook/route.ts` (Lines 146-156)

```typescript
// Fetch artwork to get user_type
let userType: 'gifter' | 'self_purchaser' | undefined;
if (metadata.artworkId) {
  try {
    const artwork = await getArtworkById(metadata.artworkId);
    userType = artwork?.user_type; // ← Retrieved from database
    console.log('📊 User type for conversion tracking:', userType);
  } catch (artworkError) {
    console.warn('⚠️ Could not fetch artwork for user_type:', artworkError);
  }
}
```

**Console log to look for**: `📊 User type for conversion tracking: gifter`

---

### 4. **Sent to Google Ads (Server-Side)** ✅
**File**: `/src/app/api/webhook/route.ts` (Lines 158-175)

```typescript
const conversionData = {
  orderId: session.id,
  value: (session.amount_total || 0) / 100,
  currency: (session.currency || 'cad').toUpperCase(),
  productType: metadata.productType || 'PawPop Print',
  customerEmail: session.customer_details?.email || undefined,
  userType: userType, // ← Passed to Google Ads
  customParameters: {
    customer_name: metadata.customerName,
    pet_name: metadata.petName,
    frame_upgrade: metadata.frameUpgrade,
    size: metadata.size
  }
};

const trackingResult = await trackServerSideConversion(conversionData);
```

**Console log to look for**: `✅ Google Ads server-side conversion tracked successfully with user_type: gifter`

---

### 5. **Formatted for Google Ads** ✅
**File**: `/src/lib/google-ads-server.ts` (Lines 84-96)

```typescript
events: [
  {
    name: 'conversion',
    params: {
      send_to: purchaseConversionLabel,
      value: conversionData.value,
      currency: conversionData.currency,
      transaction_id: conversionData.orderId,
      event_category: 'ecommerce',
      event_label: 'purchase_completed',
      product_type: conversionData.productType,
      user_type: conversionData.userType || 'unknown', // ← Custom parameter
      ...conversionData.customParameters
    }
  }
]
```

**Google Ads receives**: `user_type: 'gifter'` or `user_type: 'self_purchaser'` or `user_type: 'unknown'`

---

### 6. **Also Sent in GA4 Event** ✅
**File**: `/src/lib/google-ads-server.ts` (Lines 98-114)

```typescript
{
  name: 'purchase',
  params: {
    transaction_id: conversionData.orderId,
    value: conversionData.value,
    currency: conversionData.currency,
    user_type: conversionData.userType || 'unknown', // ← Also in GA4
    items: [...]
  }
}
```

---

### 7. **Client-Side Tracking (Backup)** ✅
**File**: `/src/lib/google-ads.ts` (Lines 134-180)

```typescript
export const trackPurchase = (
  orderId: string, 
  value: number, 
  productType: string,
  currency: string = 'CAD',
  userData?: EnhancedConversionData,
  userType?: 'gifter' | 'self_purchaser' // ← Parameter available
) => {
  // ...
  const conversionData: ConversionEvent = {
    send_to: GOOGLE_ADS_CONVERSIONS.PURCHASE,
    value: value,
    currency: currency,
    transaction_id: orderId,
    custom_parameters: {
      event_category: 'ecommerce',
      event_label: 'purchase_completed',
      product_type: productType,
      user_type: userType || 'unknown' // ← Sent to Google Ads
    }
  };

  window.gtag('event', 'conversion', conversionData);
  
  // Also in GA4 event
  window.gtag('event', 'purchase', {
    transaction_id: orderId,
    value: value,
    currency: currency,
    user_type: userType || 'unknown', // ← Also here
    items: [...]
  });
}
```

---

## 🔍 How to Verify in Production

### Method 1: Check Console Logs
After a purchase is made, look for these log messages in your production logs:

```
📊 User type for conversion tracking: gifter
✅ Google Ads server-side conversion tracked successfully with user_type: gifter
🎯 Google Ads Server-Side Conversion Tracked (Enhanced): {
  conversion_id: 'AW-939186815',
  order_id: 'cs_...',
  value: 79.99,
  currency: 'CAD',
  product_type: 'framed_canvas',
  user_type: 'gifter', ← THIS IS THE KEY
  timestamp: '2025-01-30T...'
}
```

### Method 2: Run Monitoring Script
```bash
npm run monitor:user-type-tracking
```

This will show:
- How many artworks have `user_type` set
- Distribution of gifters vs. self-purchasers
- Revenue analysis by user type

### Method 3: Check Google Ads (After 24-48 hours)
1. Go to **Tools & Settings** > **Conversions**
2. Select your "Purchase" conversion action
3. Click **Segments** tab
4. Look for `user_type` parameter with values:
   - `gifter`
   - `self_purchaser`
   - `unknown`

### Method 4: Check Browser Network Tab (Real-time)
1. Open browser DevTools > Network tab
2. Filter for `google-analytics.com` or `googleadmanager.com`
3. Complete a test purchase
4. Look for request with `user_type` parameter in payload

---

## ⚠️ Important: Missing Piece

**ISSUE FOUND**: The `artworkId` is NOT being passed to Stripe checkout metadata!

**File**: `/src/app/api/checkout/artwork/route.ts` (Lines 183-191)

```typescript
metadata: {
  artworkId,          // ← This IS included ✅
  productType,
  size,
  customerName: customerName.substring(0, 50),
  petName: (petName || '').substring(0, 50),
  frameUpgrade: frameUpgrade.toString(),
  quantity: quantity.toString()
  // artworkId is here, so this should work ✅
}
```

**Actually, this looks correct!** The `artworkId` IS being passed in metadata.

---

## ✅ Verification Checklist

- [x] User type captured at upload (`UploadModalEmailFirst.tsx`)
- [x] User type saved to database (`artworks.user_type`)
- [x] Artwork ID passed to Stripe metadata
- [x] Webhook retrieves artwork by ID
- [x] User type extracted from artwork
- [x] User type passed to `trackServerSideConversion()`
- [x] User type included in Google Ads conversion event
- [x] User type included in GA4 purchase event
- [x] Console logging for debugging
- [x] Fallback to 'unknown' if unavailable

---

## 🎯 Expected Google Ads Data

Once deployed and after 24-48 hours, you should see in Google Ads:

### Custom Segments
- **PawPop - Gift Buyers**: Users where `user_type = 'gifter'`
- **PawPop - Self Purchasers**: Users where `user_type = 'self_purchaser'`

### Custom Columns
- **Gifter Conversions**: Count of conversions from gifters
- **Gifter Value**: Total revenue from gifters
- **Self-Purchaser Conversions**: Count of conversions from self-purchasers
- **Self-Purchaser Value**: Total revenue from self-purchasers

### Example Data
```
Campaign: Pawpop-webtraffic-search
├─ Total Conversions: 10
├─ Gifter Conversions: 6 (60%)
├─ Self-Purchaser Conversions: 4 (40%)
├─ Gifter Value: $479.94 CAD (avg: $79.99)
└─ Self-Purchaser Value: $239.96 CAD (avg: $59.99)
```

---

## 🐛 Potential Issues & Solutions

### Issue 1: All conversions showing as "unknown"
**Cause**: Artwork ID not being passed or artwork not found
**Solution**: 
1. Check console logs for `📊 User type for conversion tracking:`
2. Verify `artworkId` is in Stripe metadata
3. Run: `npm run monitor:user-type-tracking`

### Issue 2: No user_type in Google Ads segments
**Cause**: Custom variable not set up correctly in Google Ads
**Solution**:
1. Verify custom variable name is exactly `user_type` (case-sensitive)
2. Check that conversion tracking is working at all
3. Wait 24-48 hours for data to populate

### Issue 3: Some conversions have user_type, others don't
**Cause**: Old artworks created before user_type implementation
**Solution**: This is expected - only new artworks will have user_type

---

## 📊 Test the Flow

### Manual Test:
1. Go to your website
2. Select "This is a gift" during upload
3. Complete the purchase flow
4. Check production logs for:
   ```
   📊 User type for conversion tracking: gifter
   ✅ Google Ads server-side conversion tracked successfully with user_type: gifter
   ```

### Automated Test:
```bash
# Run monitoring script
npm run monitor:user-type-tracking

# Should show:
# Total artworks (last 30 days): X
#   ├─ Gifters: Y (Z%)
#   ├─ Self-Purchasers: A (B%)
#   └─ Null (not set): C (D%)
```

---

## 🎉 Conclusion

**Your codebase IS correctly sending `user_type` to Google Ads!**

The data flow is complete:
1. ✅ Captured from user
2. ✅ Saved to database
3. ✅ Retrieved during purchase
4. ✅ Sent to Google Ads
5. ✅ Available for segmentation

**Next steps:**
1. Deploy to production (if not already)
2. Wait 24-48 hours for data to populate
3. Verify in Google Ads > Conversions > Segments
4. Start analyzing performance by user type!

---

**Questions?** Run `npm run monitor:user-type-tracking` for diagnostics.
