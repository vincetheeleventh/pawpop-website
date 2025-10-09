# 🚨 Google Ads Conversion Tracking - Troubleshooting Guide

## Current Status

✅ **Code Implementation:** COMPLETE  
✅ **Environment Variables:** SET  
❌ **Conversions Not Showing in Google Ads**  

---

## 🔍 Root Cause Analysis

Based on diagnostic checks, your code is **correctly implemented** but conversions aren't appearing in Google Ads Manager. Here are the **most likely causes**:

### 1. ⚠️ **Conversion Actions Not Created in Google Ads** (MOST LIKELY)

Your conversion IDs exist in the code, but they may not be properly set up in your Google Ads account.

**How to Check:**
1. Go to [Google Ads](https://ads.google.com)
2. Click **Tools & Settings** (wrench icon)
3. Click **Conversions** under "Measurement"
4. Look for these 4 conversion actions:
   - PawPop Photo Upload
   - PawPop Artwork Generated
   - PawPop Artwork Viewed
   - PawPop Purchase

**If they're missing or not configured:**
- The conversion IDs in your `.env.local` won't work
- You need to create them following the guide below

---

### 2. ⏰ **Reporting Delay** (24-48 Hours)

Google Ads conversions don't appear immediately. There's a natural delay of:
- **Testing conversions:** 3-6 hours
- **Real conversions:** 24-48 hours
- **Full attribution data:** Up to 3 days

**Action:** Wait 24-48 hours after firing test conversions before troubleshooting further.

---

### 3. 🚫 **Campaign is Paused**

According to your documentation, your campaign **"Pawpop-webtraffic-search"** is **PAUSED**.

**Status:** Campaign ID 23001379830 - ❌ PAUSED

**Why this matters:**
- Even if conversions fire, they won't show up properly if the campaign isn't active
- Attribution requires an active campaign with clicks

**How to Fix:**
1. Go to [Google Ads Campaigns](https://ads.google.com/aw/campaigns)
2. Find "Pawpop-webtraffic-search"
3. Toggle the switch to **ENABLED**
4. Set daily budget ($20-50 CAD recommended)

---

### 4. ⚙️ **Conversion Action Status Issues**

Even if conversion actions exist, they might be:
- **Disabled/Paused:** Check status in Conversions page
- **Wrong attribution settings:** Must allow click and view conversions
- **Wrong conversion window:** Should be 30-day click, 1-day view
- **Wrong counting method:** Should be "One" for most events

---

### 5. 🔢 **Value Mismatch Between Code and Google Ads**

**CRITICAL FINDING:** Your code has different values than documentation:

| Event | In Code | In Docs | In Google Ads? |
|-------|---------|---------|----------------|
| Photo Upload | $5 CAD | $2 CAD | ??? |
| Artwork Generation | $15 CAD | $8 CAD | ??? |
| Artwork View | $2 CAD | $1 CAD | ??? |

**Action Required:** Make sure your Google Ads conversion actions use the **same values as your code**:
- Photo Upload: $5 CAD (fixed value)
- Artwork Generation: $15 CAD (fixed value)
- Artwork View: $2 CAD (fixed value)
- Purchase: Transaction-specific value

---

## ✅ Step-by-Step Fix

### Step 1: Verify Conversion Actions Exist

1. Go to **Google Ads → Tools → Conversions**
2. Check if you have 4 conversion actions set up
3. **If NO:** Follow the creation guide below
4. **If YES:** Verify each one's settings (Step 2)

---

### Step 2: Create Missing Conversion Actions

For each missing conversion action, create it with these exact settings:

#### A. Photo Upload Conversion

```
Name: PawPop Photo Upload
Category: Sign-up
Value: $5 CAD (Use the same value for each conversion)
Count: One
Click-through conversion window: 30 days
View-through conversion window: 1 day
Include in "Conversions": YES
Attribution model: Data-driven (or Last click if unavailable)
```

**After creating:**
- Copy the Conversion ID (format: `AW-939186815/XXXXXXXXXXX`)
- **Replace** `NEXT_PUBLIC_GOOGLE_ADS_PHOTO_UPLOAD_ID` in `.env.local`

#### B. Artwork Generation Conversion

```
Name: PawPop Artwork Generated  
Category: Lead
Value: $15 CAD (Use the same value for each conversion)
Count: One
Click-through conversion window: 30 days
View-through conversion window: 1 day
Include in "Conversions": YES
Attribution model: Data-driven
```

#### C. Artwork View Conversion

```
Name: PawPop Artwork Viewed
Category: Page view
Value: $2 CAD (Use the same value for each conversion)
Count: One
Click-through conversion window: 30 days
View-through conversion window: 1 day
Include in "Conversions": YES
Attribution model: Data-driven
```

#### D. Purchase Conversion

```
Name: PawPop Purchase
Category: Purchase
Value: Use different values for each conversion (dynamic)
Count: One
Click-through conversion window: 30 days
View-through conversion window: 1 day
Include in "Conversions": YES
Attribution model: Data-driven
```

---

### Step 3: Update Environment Variables

After creating conversion actions, you'll get new conversion labels. Update `.env.local`:

```bash
# Example - replace with YOUR actual IDs from Google Ads
NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID=AW-939186815
NEXT_PUBLIC_GOOGLE_ADS_PHOTO_UPLOAD_ID=AW-939186815/YOUR_PHOTO_LABEL
NEXT_PUBLIC_GOOGLE_ADS_ARTWORK_GENERATION_ID=AW-939186815/YOUR_ARTWORK_LABEL
NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_ID=AW-939186815/YOUR_PURCHASE_LABEL
NEXT_PUBLIC_GOOGLE_ADS_ARTWORK_VIEW_ID=AW-939186815/YOUR_VIEW_LABEL
```

**Important:** The labels (after the `/`) must match what Google Ads gives you!

---

### Step 4: Enable Your Campaign

1. Go to **Campaigns** in Google Ads
2. Find "Pawpop-webtraffic-search" (ID: 23001379830)
3. Click the toggle to **Enable**
4. Set daily budget: **$20-50 CAD** to start
5. Verify campaign is actively serving

---

### Step 5: Test Conversions

#### Option A: Use Test HTML File (Recommended)

1. Upload `/scripts/verify-google-ads-live.html` to your website
2. Visit: `https://pawpopart.com/verify-google-ads-live.html`
3. Click "Check gtag Status" - should show ✅
4. Click each test button
5. Open DevTools → Network tab → filter "collect"
6. You should see network requests to `google-analytics.com/collect`

#### Option B: Test on Live Site

1. Visit https://pawpopart.com
2. Open DevTools (F12) → Console
3. Upload a photo and complete the flow
4. Look for console logs: "Google Ads: Photo upload conversion tracked"
5. Check Network tab for gtag requests

---

### Step 6: Verify in Google Ads (Wait 3-6 Hours)

1. Go to **Google Ads → Tools → Conversions**
2. Click on each conversion action
3. Look for "Recent conversions" data
4. If showing data: ✅ **Working!**
5. If no data after 24 hours: Continue troubleshooting

---

## 🧪 Testing Commands

### Browser Console Test

Open your live site, then run in console:

```javascript
// Test photo upload conversion
gtag('event', 'conversion', {
  send_to: 'AW-939186815/bSpECPPkoZ8bEP-0678D',
  value: 5.0,
  currency: 'CAD'
});

// Check if it fired
console.log('Conversion fired! Check Network tab for requests to google-analytics.com');
```

### Check if gtag is Loaded

```javascript
// Should return "function"
typeof gtag

// Should return array with events
window.dataLayer
```

---

## 🔍 Advanced Troubleshooting

### Issue: No gtag Requests in Network Tab

**Causes:**
- Ad blocker is blocking gtag script
- CSP (Content Security Policy) blocking
- Script not loading due to network error

**Solutions:**
1. Test in **incognito mode** with ad blockers disabled
2. Check browser console for errors
3. Verify script tag is present: `view-source:https://pawpopart.com`
4. Look for: `<script src="https://www.googletagmanager.com/gtag/js?id=AW-939186815">`

---

### Issue: Conversions Fire But Don't Show in Google Ads

**Causes:**
- Conversion action doesn't exist or is disabled
- Wrong conversion ID/label
- Attribution window hasn't passed
- Conversion action set to "Don't include in Conversions"

**Solutions:**
1. Double-check conversion ID matches in both places
2. Wait full 24-48 hours
3. Verify conversion action is enabled and included
4. Check if using enhanced conversions (requires setup)

---

### Issue: Conversions Show as "Unverified"

**Normal behavior:** New conversions show as "unverified" until Google validates them (can take 7-14 days).

**Not a problem:** They still count toward optimization!

---

## 📊 Expected Results After Setup

Once properly configured, you should see:

**Within 3-6 hours:**
- Test conversions appearing in Google Ads
- Conversion status showing "Active"

**Within 24-48 hours:**
- Real user conversions being tracked
- Conversion counts incrementing

**Within 7-14 days:**
- Conversions marked as "Verified"
- Full attribution data available
- Enough data for campaign optimization

---

## 🎯 Success Metrics

Your conversion tracking is working correctly when:

- ✅ Each conversion action shows non-zero count
- ✅ Network tab shows requests to `google-analytics.com/collect`
- ✅ Console logs show "Google Ads: [event] conversion tracked"
- ✅ Google Ads dashboard shows conversion data
- ✅ Campaign performance metrics include conversion data

---

## 📞 Next Steps

1. **Immediate:** Check if conversion actions exist in Google Ads
2. **If missing:** Create them using the guide above
3. **If exist:** Verify they're enabled and properly configured
4. **Then:** Enable your paused campaign
5. **Finally:** Test using the HTML verification file
6. **Wait:** 24-48 hours for data to appear

---

## 🆘 Still Not Working?

If after following all steps conversions still aren't tracking:

1. **Verify gtag is loading:** Use the HTML test file
2. **Check Google Ads account access:** Ensure you have admin access
3. **Review Google Ads diagnostics:** Tools → Conversions → Click conversion → Diagnostics
4. **Contact Google Ads support:** They can verify server-side issues
5. **Use Google Tag Assistant:** Chrome extension to debug tracking

---

## 📚 Additional Resources

- [Google Ads Conversion Tracking Guide](https://support.google.com/google-ads/answer/1722022)
- [Conversion Tracking Troubleshooting](https://support.google.com/google-ads/answer/2998031)
- [Google Tag Assistant Chrome Extension](https://chrome.google.com/webstore/detail/tag-assistant-legacy-by-g/kejbdjndbnbjgmefkgdddjlbokphdefk)

---

**Last Updated:** 2025-09-29  
**Status:** Code implementation complete, awaiting Google Ads configuration
