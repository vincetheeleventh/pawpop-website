# Meta Conversions API Setup Guide - PawPop

## 🎯 Quick Setup Checklist

Your Pixel ID: **828833546257064**

- [ ] Get Conversions API Access Token
- [ ] Add environment variables to `.env.local`
- [ ] Test with Test Events
- [ ] Verify Event Match Quality
- [ ] Set up conversion events in Ads Manager
- [ ] Configure Aggregated Event Measurement (iOS 14.5+)

---

## Step 1: Get Your Conversions API Access Token

### Option A: Generate in Events Manager (Recommended)

1. Go to [Meta Events Manager](https://business.facebook.com/events_manager2)
2. Select your Data Source (Pixel ID: 828833546257064)
3. Click **Settings** tab in the left sidebar
4. Scroll down to **Conversions API** section
5. Click **Generate Access Token**
6. Copy the token (starts with `EAA...` and is very long ~200 characters)
7. **Important**: Save this token securely - you can't view it again!

### Option B: Generate via Business Settings

1. Go to [Business Settings](https://business.facebook.com/settings)
2. Click **Data Sources** → **Pixels**
3. Select your Pixel (828833546257064)
4. Click **Settings**
5. Under **Conversions API**, click **Generate Access Token**

---

## Step 2: Get Test Event Code (Optional but Recommended)

This allows you to see events in real-time during testing:

1. In Events Manager, go to **Test Events** tab
2. Click **Test Server Events** button
3. Copy the **Test Event Code** shown (format: `TEST12345`)
4. Keep this tab open - you'll use it to verify events

---

## Step 3: Add to Your `.env.local` File

Add these three lines to your `.env.local`:

```bash
# Meta (Facebook) Ads Pixel & Conversions API
NEXT_PUBLIC_META_PIXEL_ID=828833546257064
META_CONVERSION_API_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
META_TEST_EVENT_CODE=TEST12345
```

**Replace**:
- `EAAxxxxxxxxx...` with your actual access token from Step 1
- `TEST12345` with your actual test event code from Step 2

---

## Step 4: Restart Your Development Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

The Meta Pixel will now be active with your Pixel ID!

---

## Step 5: Test Client-Side Pixel

### Install Meta Pixel Helper

1. Install [Meta Pixel Helper Chrome Extension](https://chrome.google.com/webstore/detail/meta-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc)
2. Visit your local site: `http://localhost:3000`
3. Click the extension icon in Chrome toolbar
4. You should see:
   - ✅ Green checkmark
   - Pixel ID: **828833546257064**
   - Event: **PageView**

### Test Conversion Events

1. **Test Lead Event** (Photo Upload):
   - Fill out the upload form
   - Submit with test data
   - Check console for: `Meta Pixel: Lead (Photo Upload) tracked`
   - Verify in Meta Pixel Helper: Should show "Lead" event

2. **Test InitiateCheckout Event**:
   - Click "Buy Now" on any product
   - Check console for: `Meta Pixel: InitiateCheckout tracked`
   - Verify in Pixel Helper: Should show "InitiateCheckout" event

---

## Step 6: Test Server-Side Conversions API

### Complete a Test Purchase

1. Use Stripe test card: `4242 4242 4242 4242`
2. Complete checkout
3. Check your server logs for:
   ```
   🎯 Meta Conversions API: Purchase tracked (server-side)
   ```

### Verify in Events Manager

1. Go to Events Manager → **Test Events** tab
2. You should see the Purchase event appear within seconds
3. Check that it includes:
   - ✅ Event name: Purchase
   - ✅ Event ID (for deduplication)
   - ✅ Customer data (hashed)
   - ✅ Purchase value

---

## Step 7: Verify Event Match Quality

After sending some test events:

1. Go to Events Manager → **Overview** tab
2. Look for **"Events Match Quality"** section
3. You should see:
   - **Event Match Quality Score**: Good or Great
   - **Match Rate**: 80%+ (higher is better)

### If Match Quality is "Poor":

**Common Issues**:
- Missing customer email
- Missing shipping address
- Not enough user data

**Our Implementation** ✅:
- Email: Captured from upload form
- Name: Split into first/last name
- Phone: From Stripe checkout (if provided)
- Address: From Stripe shipping (city, state, zip, country)
- All data SHA-256 hashed for privacy

---

## Step 8: Configure Aggregated Event Measurement (iOS 14.5+)

Due to Apple's iOS 14.5+ privacy changes, you need to configure which events to prioritize:

### Setup Steps:

1. Go to Events Manager → **Aggregated Event Measurement**
2. Click **Configure Web Events**
3. Add your domain: `pawpopart.com`
4. **Prioritize these 8 events** (in order):

   | Priority | Event Name | Value |
   |----------|------------|-------|
   | 1 | Purchase | Actual order value |
   | 2 | InitiateCheckout | Cart value |
   | 3 | Lead | $2 CAD |
   | 4 | ViewContent (Artwork Generated) | $8 CAD |
   | 5 | ViewContent (Artwork Page) | $1 CAD |
   | 6 | PageView | - |
   | 7 | (Leave empty) | - |
   | 8 | (Leave empty) | - |

5. Click **Submit for Review**
6. Wait for Meta approval (usually 24-72 hours)

**Why this matters**: iOS users who opt-out of tracking will only report your top 8 prioritized events.

---

## Step 9: Set Up Conversion Events in Ads Manager

Now that tracking is working, configure your ad campaigns:

### Create Custom Conversions (Optional)

1. Go to [Events Manager](https://business.facebook.com/events_manager2)
2. Click **Custom Conversions** in left sidebar
3. Click **Create Custom Conversion**

**Recommended Custom Conversions**:

#### 1. High-Value Purchases (>$100)
- **Name**: High Value Purchase
- **Data Source**: Your Pixel (828833546257064)
- **Event**: Purchase
- **Rule**: Value is greater than 100
- **Value**: Use actual value

#### 2. Artwork Completed
- **Name**: Artwork Generation Complete
- **Data Source**: Your Pixel
- **Event**: ViewContent
- **Rule**: Content Name contains "Artwork Generation"
- **Value**: $8

---

## Step 10: Create Your First Conversion Campaign

### Campaign Setup:

1. Go to [Ads Manager](https://business.facebook.com/adsmanager)
2. Click **Create** → New Campaign
3. Choose objective: **Sales** or **Conversions**

### Ad Set Configuration:

**Conversion Event**: Select **Purchase** (from your Pixel)

**Optimization**:
- ✅ Enable **Value Optimization** (optimize for highest value purchases)
- ✅ Set **Conversion Window**: 7-day click, 1-day view (default)

**Budget**: Start with $20-50/day for testing

**Audience**: 
- Start broad (let Meta's algorithm find your buyers)
- Or create Lookalike Audience from purchasers (need 100+ purchases first)

### Ad Creative Best Practices:

**For PawPop**:
- Show before/after transformations
- Highlight "owner + pet together" unique value prop
- Use social proof: "⭐️⭐️⭐️⭐️⭐️ Loved by 10,000+ pet moms"
- Clear CTA: "Create Your Masterpiece Free"

---

## Step 11: Monitor & Optimize

### Daily Checks (First Week):

1. **Events Manager** → Check event volume:
   - PageView: Should match site traffic
   - Lead: ~5-10% of visitors
   - InitiateCheckout: ~20-30% of leads
   - Purchase: ~10-20% of checkouts

2. **Event Match Quality**:
   - Should be "Good" or "Great"
   - If "Poor", check server logs for errors

3. **Ads Manager** → Check campaign performance:
   - ROAS (Return on Ad Spend): Target 2.5x+ 
   - CPA (Cost Per Acquisition): Should be < 50% of average order value
   - CTR (Click-Through Rate): Target 1%+

### Weekly Optimization:

1. **Review Top Performing Ads**:
   - Increase budget on winners
   - Pause ads with ROAS < 1.5x

2. **Test New Audiences**:
   - Lookalike audiences (1-2% similarity)
   - Interest targeting: Pet owners, art lovers, gift givers

3. **A/B Test Creative**:
   - Different before/after examples
   - Various headlines and CTAs
   - Video vs. static images

---

## Troubleshooting

### Issue: Events Not Appearing in Events Manager

**Check**:
1. Environment variables are set correctly in `.env.local`
2. Server restarted after adding env vars
3. Access token is valid (regenerate if needed)
4. Check browser console for errors
5. Check server logs for API errors

**Solution**:
```bash
# Verify env vars are loaded
npm run dev
# Check console output for "Meta Pixel: Script loaded successfully"
```

---

### Issue: "Invalid Access Token" Error

**Cause**: Token expired or incorrect

**Solution**:
1. Go to Events Manager → Settings → Conversions API
2. Click **Generate Access Token** (new one)
3. Update `META_CONVERSION_API_ACCESS_TOKEN` in `.env.local`
4. Restart server

---

### Issue: Poor Event Match Quality

**Cause**: Missing customer data

**Check Our Implementation** ✅:
- Email: Captured in upload form
- Name: Captured and split into first/last
- Phone: From Stripe (if provided)
- Address: From Stripe shipping

**Verify**:
1. Check Events Manager → Test Events
2. Click on a Purchase event
3. Expand "Event Details"
4. Verify "Customer Information" section has hashed data

---

### Issue: Duplicate Purchase Events

**Cause**: Event deduplication not working

**Our Implementation** ✅:
- Client and server both generate/use same `event_id`
- Meta automatically deduplicates within 48 hours

**Verify**:
1. Complete a test purchase
2. Check Events Manager → Test Events
3. Look for "Deduplication" column
4. Should show "1 event" not "2 events"

---

### Issue: iOS Users Not Converting

**Cause**: iOS 14.5+ privacy restrictions

**Solution**:
1. Ensure Aggregated Event Measurement is configured (Step 8)
2. Prioritize Purchase event as #1
3. Consider using Conversions API only (more reliable than Pixel for iOS)

**Our Implementation** ✅:
- Server-side tracking via Conversions API
- Not affected by iOS tracking restrictions
- More reliable than client-side Pixel alone

---

## Advanced: Conversion API Rules & Best Practices

### Data Privacy & Compliance

✅ **Our Implementation**:
- All PII (email, phone, name, address) is SHA-256 hashed before transmission
- No plain-text personal data sent to Meta
- GDPR & CCPA compliant
- User data only used for attribution, not stored by Meta

### Event Deduplication Rules

**How It Works**:
1. Client-side Pixel fires Purchase event with `event_id: "abc123"`
2. Server-side API fires Purchase event with same `event_id: "abc123"`
3. Meta receives both events within 48 hours
4. Meta keeps only 1 event (deduplicates by event_id)

**Why It Matters**:
- Prevents inflated conversion counts
- Accurate ROAS calculation
- Better campaign optimization

### Advanced Matching Parameters

**What We Send** (all hashed):
- `em`: Email
- `ph`: Phone
- `fn`: First name
- `ln`: Last name
- `ct`: City
- `st`: State
- `zp`: Zip code
- `country`: Country code

**Impact**: 20-30% improvement in attribution accuracy

### Server-Side vs Client-Side

**Client-Side Pixel**:
- ✅ Easy to implement
- ✅ Automatic PageView tracking
- ❌ Blocked by ad blockers (~25% of users)
- ❌ Affected by iOS 14.5+ restrictions
- ❌ Less reliable for conversions

**Server-Side Conversions API**:
- ✅ Not blocked by ad blockers
- ✅ Not affected by iOS restrictions
- ✅ More reliable for revenue tracking
- ✅ Better data quality
- ❌ Requires server implementation

**Our Implementation** ✅:
- **Both** client-side AND server-side
- Best of both worlds
- Event deduplication prevents double-counting

---

## Production Deployment Checklist

Before deploying to production:

- [ ] Remove `META_TEST_EVENT_CODE` from production `.env.local` (or leave it for initial monitoring)
- [ ] Verify `NEXT_PUBLIC_META_PIXEL_ID=828833546257064` is set
- [ ] Verify `META_CONVERSION_API_ACCESS_TOKEN` is set
- [ ] Test all conversion events work in production
- [ ] Verify Event Match Quality is "Good" or "Great"
- [ ] Configure Aggregated Event Measurement
- [ ] Set up conversion campaigns in Ads Manager
- [ ] Monitor for 48 hours before scaling budget

---

## Support & Resources

### Meta Documentation
- [Conversions API Guide](https://developers.facebook.com/docs/marketing-api/conversions-api)
- [Event Deduplication](https://developers.facebook.com/docs/marketing-api/conversions-api/deduplicate-pixel-and-server-events)
- [Advanced Matching](https://developers.facebook.com/docs/meta-pixel/advanced/advanced-matching)

### PawPop Implementation
- Full setup guide: `/docs/marketing/META_ADS_SETUP.md`
- Implementation summary: `/docs/marketing/META_ADS_IMPLEMENTATION_SUMMARY.md`
- Client-side code: `/src/lib/meta-ads.ts`
- Server-side code: `/src/lib/meta-ads-server.ts`

### Getting Help
- Meta Business Help Center: https://business.facebook.com/business/help
- Events Manager: https://business.facebook.com/events_manager2
- Meta Developer Support: https://developers.facebook.com/support

---

**Last Updated**: January 2025  
**Your Pixel ID**: 828833546257064  
**Status**: Ready for activation
