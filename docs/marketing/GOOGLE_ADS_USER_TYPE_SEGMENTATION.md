# Google Ads User Type Segmentation Setup Guide

## Overview
This guide explains how to set up custom segments and columns in Google Ads to analyze performance by user type (gifters vs. self-purchasers) without making any bid or budget changes.

## Implementation Status
✅ **Code Implementation Complete**
- `user_type` parameter added to all conversion tracking (client-side and server-side)
- Webhook handler updated to fetch and pass user_type from artwork records
- TypeScript interfaces updated with proper type safety

## User Type Definitions
- **gifter**: Users who selected "This is a gift" during checkout
- **self_purchaser**: Users who are buying for themselves
- **unknown**: Users where type couldn't be determined (fallback)

## 🛠️ Google Ads UI Setup Instructions

### Step 1: Create Custom Segments

#### For Gifters:
1. Go to **Audience Manager** (Tools & Settings > Shared Library > Audience Manager)
2. Click the **+ button** and select **"Custom segments"**
3. Set up as follows:
   - **Name**: `PawPop - Gift Buyers`
   - **Description**: `Users who selected "This is a gift" during checkout`
   - **Membership duration**: `90 days`
   - **Segment**:
     - Include > Conditions > Custom parameters
     - Parameter: `user_type`
     - Condition: `equals`
     - Value: `gifter`

#### For Self-Purchasers:
1. Same as above, but with:
   - **Name**: `PawPop - Self Purchasers`
   - **Description**: `Users who are buying for themselves`
   - **Value**: `self_purchaser`

### Step 2: Add Custom Columns

#### Navigate to Campaigns View:
1. Go to **Campaigns**
2. Click the **columns icon (⋮)** > **Modify columns**
3. Under **"Custom columns"**, create these:

#### Column 1: Gifter Conversions
- **Name**: `Gifter Conversions`
- **Type**: Metrics
- **Aggregate function**: Sum
- **Formatting**: 0 decimal places
- **Formula**:
```
IF(user_type = 'gifter', Conversions, 0)
```

#### Column 2: Gifter Conversion Value
- **Name**: `Gifter Value`
- **Type**: Metrics
- **Aggregate function**: Sum
- **Formatting**: 2 decimal places
- **Formula**:
```
IF(user_type = 'gifter', Conversion value, 0)
```

#### Column 3: Self-Purchaser Conversions
- **Name**: `Self-Purchaser Conversions`
- **Type**: Metrics
- **Aggregate function**: Sum
- **Formatting**: 0 decimal places
- **Formula**:
```
IF(user_type = 'self_purchaser', Conversions, 0)
```

#### Column 4: Self-Purchaser Value
- **Name**: `Self-Purchaser Value`
- **Type**: Metrics
- **Aggregate function**: Sum
- **Formatting**: 2 decimal places
- **Formula**:
```
IF(user_type = 'self_purchaser', Conversion value, 0)
```

#### Column 5: Unknown User Type Conversions
- **Name**: `Unknown Type Conversions`
- **Type**: Metrics
- **Aggregate function**: Sum
- **Formatting**: 0 decimal places
- **Formula**:
```
IF(user_type = 'unknown', Conversions, 0)
```

### Step 3: Save as Custom Report

1. After setting up columns, click **Save** > **Save as report**
2. **Name it**: `PawPop - Performance by User Type`
3. Set view to **"Segment by: user_type"**

### Step 4: Verify Data Flow

1. Go to **Tools & Settings** > **Conversions**
2. Select your main conversion action (e.g., "Purchase")
3. Click **"Segments"** and verify you see data for:
   - `user_type=gifter`
   - `user_type=self_purchaser`
   - `user_type=unknown`

## ⏱️ Expected Data Delay

- **Segments**: May take 24-48 hours to populate with data
- **Custom columns**: Should show data within 24 hours
- **Check back tomorrow** to see initial results

## 📊 Data Flow Architecture

### Client-Side Tracking (Browser)
```javascript
// When user completes purchase on artwork page
trackPurchase(
  orderId,
  value,
  productType,
  currency,
  userData,
  userType // 'gifter' | 'self_purchaser'
);
```

### Server-Side Tracking (Webhook)
```typescript
// Stripe webhook fetches artwork and user_type
const artwork = await getArtworkById(metadata.artworkId);
const userType = artwork?.user_type;

trackServerSideConversion({
  orderId: session.id,
  value: amount,
  currency: 'CAD',
  productType: metadata.productType,
  userType: userType, // Passed to Google Ads
  customParameters: { ... }
});
```

### Google Ads Receives
```json
{
  "event": "conversion",
  "send_to": "AW-939186815/PURCHASE_LABEL",
  "value": 79.99,
  "currency": "CAD",
  "transaction_id": "cs_test_...",
  "user_type": "gifter", // ← Custom parameter for segmentation
  "product_type": "framed_canvas"
}
```

## 🔍 Monitoring & Verification

### Check Console Logs
Look for these log messages in production:
```
📊 User type for conversion tracking: gifter
✅ Google Ads server-side conversion tracked successfully with user_type: gifter
🎯 Google Ads Server-Side Conversion Tracked (Enhanced): { user_type: 'gifter', ... }
```

### Use Monitoring Script
Run the monitoring script to verify data flow:
```bash
npm run monitor:user-type-tracking
```

### Verify in Google Ads
1. Go to **Conversions** page
2. Select a conversion action
3. Click **Segments** tab
4. Look for `user_type` parameter with values: `gifter`, `self_purchaser`, `unknown`

## 📈 Analysis & Insights

### Key Metrics to Track
1. **Conversion Rate by User Type**
   - Gifters vs. Self-Purchasers
   - Which segment converts better?

2. **Average Order Value (AOV)**
   - Do gifters spend more than self-purchasers?
   - Product preference differences?

3. **Cost Per Acquisition (CPA)**
   - Which segment is more cost-effective to acquire?
   - Should we adjust bidding strategies?

4. **Product Preferences**
   - Digital vs. Physical products
   - Size preferences by user type

### Sample Analysis Queries

#### Compare Conversion Rates
```
Gifter Conversions / Gifter Clicks = Gifter CVR
Self-Purchaser Conversions / Self-Purchaser Clicks = Self-Purchaser CVR
```

#### Compare Average Order Values
```
Gifter Value / Gifter Conversions = Gifter AOV
Self-Purchaser Value / Self-Purchaser Conversions = Self-Purchaser AOV
```

#### Identify High-Value Segment
```
IF Gifter AOV > Self-Purchaser AOV:
  → Focus marketing on gift-giving occasions
ELSE:
  → Emphasize personal pet art ownership
```

## 🎯 Optimization Strategies

### If Gifters Convert Better:
- Create gift-focused ad copy
- Emphasize occasions (birthdays, holidays, Mother's Day)
- Highlight gift packaging and presentation
- Target gift-giving keywords

### If Self-Purchasers Convert Better:
- Focus on personal enjoyment messaging
- Emphasize home decor and personalization
- Target pet owner communities
- Highlight emotional connection with pets

### If AOV Differs Significantly:
- Adjust bidding strategies by segment
- Create segment-specific landing pages
- Tailor product recommendations
- Optimize pricing strategy per segment

## 🚀 Next Steps

1. **Week 1**: Set up custom segments and columns in Google Ads UI
2. **Week 2**: Monitor data collection and verify tracking
3. **Week 3**: Analyze initial results and identify trends
4. **Week 4**: Implement optimization strategies based on insights

## 📝 Notes

- **No bid changes required**: This is purely for analysis and reporting
- **Privacy-compliant**: User type is based on checkout selection, not personal data
- **Fallback handling**: Unknown types are tracked separately for data quality
- **Server-side tracking**: Ensures accurate attribution even with ad blockers

## 🔗 Related Documentation

- [Google Ads Conversion Setup](./GOOGLE_ADS_CONVERSION_SETUP.md)
- [Enhanced Conversions Implementation](./GOOGLE_ADS_ENHANCED_CONVERSIONS_SUMMARY.md)
- [Plausible Analytics Integration](../../src/lib/plausible.ts)

## 🆘 Troubleshooting

### No Data Showing in Segments
- Wait 24-48 hours for data to populate
- Verify `user_type` is being sent in conversion events (check console logs)
- Ensure artwork records have `user_type` field populated
- Check that webhook is successfully fetching artwork data

### "Unknown" User Types Dominating
- Check if users are completing the gift selection step
- Verify `user_type` is being saved to artwork records during upload
- Review UploadModalEmailFirst component for proper tracking

### Custom Columns Not Working
- Verify formula syntax matches Google Ads requirements
- Check that parameter name is exactly `user_type` (case-sensitive)
- Ensure conversion actions are properly configured

## 📞 Support

For questions or issues with this implementation:
1. Check console logs for tracking events
2. Run the monitoring script: `npm run monitor:user-type-tracking`
3. Review this documentation for setup steps
4. Contact development team if issues persist
