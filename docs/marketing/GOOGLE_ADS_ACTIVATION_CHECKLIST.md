# Google Ads Campaign Activation Checklist

## Immediate Actions Required

### 1. Activate Your Paused Campaign ⚡

**Steps:**
1. Go to [Google Ads](https://ads.google.com)
2. Navigate to **Campaigns** → **"Pawpop-webtraffic-search"**
3. Click the **toggle switch** to change status from "Paused" to "Enabled"
4. Campaign will start running immediately with current $20.42 CAD/day budget

### 2. Create Conversion Actions 🎯

Go to **Tools & Settings** → **Conversions** → **+ New Conversion Action** → **Website**

#### Conversion Action 1: Photo Upload
- **Conversion Name:** `PawPop Photo Upload`
- **Category:** Sign-up
- **Value:** Use the same value for each conversion → `5` CAD
- **Count:** One
- **Click-through conversion window:** 30 days
- **View-through conversion window:** 1 day
- **Attribution model:** Data-driven
- **Include in "Conversions":** Yes

#### Conversion Action 2: Artwork Generated  
- **Conversion Name:** `PawPop Artwork Generated`
- **Category:** Lead
- **Value:** Use the same value for each conversion → `15` CAD
- **Count:** One
- **Click-through conversion window:** 30 days
- **View-through conversion window:** 1 day
- **Attribution model:** Data-driven
- **Include in "Conversions":** Yes

#### Conversion Action 3: Artwork Viewed
- **Conversion Name:** `PawPop Artwork Viewed`
- **Category:** Page view
- **Value:** Use the same value for each conversion → `2` CAD
- **Count:** One
- **Click-through conversion window:** 30 days
- **View-through conversion window:** 1 day
- **Attribution model:** Data-driven
- **Include in "Conversions":** Yes

#### Conversion Action 4: Purchase
- **Conversion Name:** `PawPop Purchase`
- **Category:** Purchase
- **Value:** Use different values for each conversion
- **Count:** One
- **Click-through conversion window:** 30 days
- **View-through conversion window:** 1 day
- **Attribution model:** Data-driven
- **Include in "Conversions":** Yes

### 3. Copy Conversion IDs 📋

After creating each conversion action, you'll see:
- **Conversion ID:** `AW-XXXXXXXXXX`
- **Conversion Label:** `XXXXXXXXXX`

**Copy these values and update your `.env.local` file:**

```bash
# Google Ads Conversion Tracking
NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID=AW-XXXXXXXXXX
NEXT_PUBLIC_GOOGLE_ADS_PHOTO_UPLOAD_ID=AW-XXXXXXXXXX/XXXXXXXXXX
NEXT_PUBLIC_GOOGLE_ADS_ARTWORK_GENERATION_ID=AW-XXXXXXXXXX/XXXXXXXXXX
NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_ID=AW-XXXXXXXXXX/XXXXXXXXXX
NEXT_PUBLIC_GOOGLE_ADS_ARTWORK_VIEW_ID=AW-XXXXXXXXXX/XXXXXXXXXX
```

### 4. Deploy Updated Environment Variables 🚀

After updating `.env.local`:
1. Restart your development server
2. Deploy to production with new environment variables
3. Test conversion tracking (see testing section below)

## Campaign Optimization Recommendations

### Current Campaign Analysis ✅

**Strengths:**
- Good daily budget: $20.42 CAD
- 43 relevant keywords with proper match types
- Well-targeted for pet mom audience
- Mix of exact, phrase, and broad match keywords

**Recommended Improvements:**

#### A. Switch to Target CPA Bidding
Your campaign currently uses "Target Spend" which will spend your full budget regardless of performance.

**Steps:**
1. Go to **Campaigns** → **"Pawpop-webtraffic-search"** → **Settings**
2. Click **Bidding** → **Change bid strategy**
3. Select **Target CPA**
4. Set initial Target CPA: **$25 CAD** (5x photo upload value)
5. Save changes

#### B. Add High-Intent Keywords
Based on PawPop's unique positioning, add these keywords:

**Exact Match (High Intent):**
- `[mona lisa pet portrait]`
- `[renaissance pet art]`
- `[pet mom mona lisa]`
- `[custom mona lisa portrait]`

**Phrase Match (Medium Intent):**
- `"pet renaissance portrait"`
- `"mona lisa style pet art"`
- `"classical pet portrait"`
- `"museum quality pet art"`

#### C. Add Negative Keywords
Prevent irrelevant clicks by adding these negative keywords:

- `-free`
- `-cheap`
- `-diy`
- `-tutorial`
- `-how to`
- `-template`
- `-tattoo`
- `-realistic` (since PawPop is artistic/stylized)

## Testing Your Setup 🧪

### 1. Test Conversion Tracking

**Photo Upload Test:**
1. Go to your website
2. Complete the photo upload process
3. Check browser console for: `Google Ads: Photo upload conversion tracked`
4. Verify in Google Ads → Tools → Conversions (may take 3-24 hours)

**Artwork View Test:**
1. Visit an artwork page: `/artwork/[token]`
2. Check browser console for: `Google Ads: Artwork view conversion tracked`

### 2. Monitor Campaign Performance

**Daily Checks (First Week):**
- Impressions and clicks
- Cost per click (target: $1-3 CAD)
- Search terms report
- Quality scores

**Weekly Reviews:**
- Conversion rates by keyword
- Cost per conversion
- Return on ad spend (ROAS)
- Search term performance

## Expected Performance Targets 🎯

**Week 1-2 (Learning Phase):**
- Impressions: 500-1,000/day
- Clicks: 10-30/day
- Cost per click: $1-3 CAD
- Photo uploads: 1-3/day

**Month 1 Goals:**
- Cost per photo upload: <$10 CAD
- Photo upload to purchase rate: >5%
- Overall ROAS: >200%

**Scaling Targets (Month 2+):**
- Increase budget to $50-100 CAD/day
- Cost per photo upload: <$7 CAD
- ROAS: >300%

## Troubleshooting 🔧

**No Impressions:**
- Check campaign status (should be "Enabled")
- Verify keywords aren't too restrictive
- Check bid amounts vs. first page estimates

**High Cost per Click:**
- Review quality scores (aim for 7+)
- Improve ad relevance
- Add negative keywords
- Consider exact match for high-performing terms

**No Conversions:**
- Verify conversion tracking implementation
- Check landing page experience
- Test conversion tracking in browser console
- Ensure environment variables are deployed

## Quick Start Summary ⚡

1. **Activate campaign** (2 minutes)
2. **Create 4 conversion actions** (15 minutes)
3. **Update environment variables** (5 minutes)
4. **Deploy to production** (10 minutes)
5. **Test conversion tracking** (10 minutes)

**Total setup time: ~45 minutes**

Your campaign is ready to drive qualified traffic to PawPop with full conversion tracking!
