# Plausible Analytics Goals Setup for Email-First Flow

## 📊 Overview

Your code is **already tracking all events correctly**. You just need to configure **Goals** in the Plausible dashboard to measure conversions and create funnels.

## ✅ Current Status

**All events are already implemented and firing:**
- ✅ Email Captured (Step 2.5)
- ✅ Upload Deferred (Step 2.6)
- ✅ Deferred Upload Completed (Step 2.7)
- ✅ All other funnel steps (1-10)

**No code changes needed!**

---

## 🎯 Plausible Dashboard Setup

### Step 1: Create Goals

Go to your Plausible dashboard → Settings → Goals and create these **Custom Events**:

#### Email-First Flow Goals (NEW)

1. **Email Captured**
   - Goal Type: Custom Event
   - Event Name: `Funnel Step: Email Captured`
   - Description: User completes email capture form
   - Importance: 🔴 Critical (new lead)

2. **Upload Deferred**
   - Goal Type: Custom Event
   - Event Name: `Funnel Step: Upload Deferred`
   - Description: User chooses "Upload Later"
   - Importance: 🟡 Important (lead recovery opportunity)

3. **Deferred Upload Completed**
   - Goal Type: Custom Event
   - Event Name: `Funnel Step: Deferred Upload Completed`
   - Description: User returns via email to complete upload
   - Importance: 🟢 Success (lead recovery worked)

#### Existing Goals (Keep These)

4. **Upload Modal Opened**
   - Event Name: `Funnel Step: Upload Modal Opened`

5. **Photo Uploaded**
   - Event Name: `Funnel Step: Photo Uploaded`

6. **Artwork Generation Started**
   - Event Name: `Funnel Step: Artwork Generation Started`

7. **Artwork Completed**
   - Event Name: `Funnel Step: Artwork Completed`

8. **Artwork Page Viewed**
   - Event Name: `Funnel Step: Artwork Page Viewed`

9. **Purchase Modal Opened**
   - Event Name: `Funnel Step: Purchase Modal Opened`

10. **Checkout Initiated**
    - Event Name: `Funnel Step: Checkout Initiated`

11. **Purchase Completed**
    - Event Name: `Funnel Step: Purchase Completed`

---

### Step 2: Create Funnels

Create these funnels to track conversion rates:

#### Funnel 1: Email-First Complete Flow
```
1. Upload Modal Opened
2. Email Captured          ← NEW
3. Photo Uploaded
4. Artwork Completed
5. Purchase Completed
```

**Purpose**: Measure full conversion from modal open to purchase

#### Funnel 2: Immediate Upload Flow
```
1. Email Captured
2. (Upload Now clicked)
3. Photo Uploaded
4. Artwork Completed
```

**Purpose**: Track users who upload immediately

#### Funnel 3: Deferred Upload Recovery
```
1. Email Captured
2. Upload Deferred         ← NEW
3. Deferred Upload Completed  ← NEW
4. Artwork Completed
```

**Purpose**: Measure email recovery effectiveness

---

## 📈 Key Metrics to Track

### Email-First Metrics (NEW)

1. **Email Capture Rate**
   - Formula: (Email Captured / Upload Modal Opened) × 100
   - Target: >75%
   - Dashboard: Create custom property `email_capture_rate`

2. **Upload Choice Split**
   - Track: `Button Click` event with `button_name` property
   - Values: "Upload Now" vs "Upload Later"
   - Target: 70/30 split (immediate/deferred)

3. **Deferred Upload Return Rate**
   - Formula: (Deferred Upload Completed / Upload Deferred) × 100
   - Target: >40%
   - Indicates email effectiveness

4. **Time to Return**
   - Track time between "Upload Deferred" and "Deferred Upload Completed"
   - Shows email engagement speed

### Existing Metrics (Enhanced)

5. **Overall Funnel Completion**
   - Formula: (Purchase Completed / Upload Modal Opened) × 100
   - Compare: Email-first flow vs old flow

6. **Artwork Completion Rate**
   - Formula: (Artwork Completed / Photo Uploaded) × 100
   - Should remain stable or improve

---

## 🎨 Plausible Dashboard Filters

### Custom Properties to Use

The code already sends these properties with events:

```typescript
// Price Variant (A/B Testing)
price_variant: 'A' | 'B'
variant_label: 'Standard Pricing' | 'Premium Pricing'

// Button Clicks
button_name: 'Upload Now' | 'Upload Later'
location: 'upload-choice'

// Form Completions
form_name: 'Email Capture Form' | 'Upload Form - Email First'
time_spent_seconds: number

// Photo Uploads
file_type: 'image/jpeg' | 'image/png' | etc.
file_size_mb: number
upload_type: 'petMom' | 'pet'
converted_from_heic: boolean
```

### Useful Filter Combinations

1. **Email-First Flow Only**
   ```
   form_name = "Email Capture Form"
   OR
   form_name contains "Email First"
   ```

2. **Upload Choice Analysis**
   ```
   button_name = "Upload Now"
   button_name = "Upload Later"
   ```

3. **A/B Test Comparison**
   ```
   price_variant = "A"
   price_variant = "B"
   ```

4. **Manual Approval Impact**
   ```
   form_name contains "Pending Approval"
   ```

---

## 🔧 Optional: Enhanced Tracking

If you want even more insights, you can track these additional metrics:

### 1. Email Validation Errors
Already tracked as: `Error Occurred` event
Filter by: `error_type = "Email validation"`

### 2. Exit Intent
Already tracked as: `Button Click` event
Filter by: `button_name = "Exit Intent Triggered"`

### 3. Photo Upload Performance
Already tracked with properties:
- `file_size_mb`
- `converted_from_heic`
- `upload_type`

---

## 📊 Dashboard Segments to Create

Create these segments in Plausible for easier analysis:

### Segment 1: Email-First Users
**Criteria**: Users who triggered "Email Captured" event
**Purpose**: Compare to old flow users

### Segment 2: Immediate Uploaders
**Criteria**: Users who clicked "Upload Now"
**Purpose**: Measure immediate conversion intent

### Segment 3: Deferred Uploaders
**Criteria**: Users who clicked "Upload Later"
**Purpose**: Track email recovery funnel

### Segment 4: Returned Uploaders
**Criteria**: Users who completed "Deferred Upload Completed"
**Purpose**: Measure email effectiveness

---

## 🎯 Conversion Goals Priority

### Critical Goals (Set Up First)
1. ✅ Email Captured
2. ✅ Purchase Completed
3. ✅ Artwork Completed

### Important Goals (Set Up Next)
4. ✅ Upload Deferred
5. ✅ Deferred Upload Completed
6. ✅ Checkout Initiated

### Nice-to-Have Goals
7. ✅ Photo Uploaded
8. ✅ Upload Modal Opened
9. ✅ Artwork Page Viewed

---

## 📝 Quick Setup Checklist

### In Plausible Dashboard:

- [ ] **Step 1**: Add site `pawpopart.com` (if not already added)
- [ ] **Step 2**: Create 11 Custom Event Goals (listed above)
- [ ] **Step 3**: Create 3 Funnels (email-first, immediate, deferred)
- [ ] **Step 4**: Create 4 Segments (email-first, immediate, deferred, returned)
- [ ] **Step 5**: Set up email reports for goal completions

### In Your Code:

- [x] ✅ All events already implemented
- [x] ✅ All properties already tracked
- [x] ✅ Validation script passing (35/35)
- [x] ✅ Documentation complete

**No code changes needed!**

---

## 🚀 After Setup

Once goals are configured, you'll see:

1. **Real-time goal completions** in Plausible dashboard
2. **Funnel conversion rates** for each flow
3. **Custom properties** for filtering and segmentation
4. **Time-series data** for trend analysis
5. **A/B test results** comparing price variants

---

## 🎓 Pro Tips

### 1. Goal Monetary Values
Consider adding monetary values to goals:
- Email Captured: $2 (lead value)
- Artwork Completed: $15 (qualified lead)
- Purchase Completed: Actual order value

### 2. Goal Notifications
Set up email alerts for:
- Purchase Completed (every purchase)
- Upload Deferred (daily summary)
- Email Captured (weekly milestone)

### 3. Dashboard Views
Create custom dashboard views:
- **Overview**: All main funnel steps
- **Email-First**: Email capture and deferred upload metrics
- **A/B Testing**: Price variant comparison
- **Performance**: Generation times and error rates

---

## 📞 Support

If events aren't appearing in Plausible:
1. Check environment variables are set
2. Verify script is loading (check browser console)
3. Test in incognito mode (ad blockers)
4. Check network tab for event requests
5. Wait 5-10 minutes for dashboard to update

---

## 🔄 Next Steps

1. **Immediate**: Set up the 3 critical goals in Plausible
2. **This Week**: Create the 3 funnels
3. **This Month**: Analyze data and optimize flow
4. **Ongoing**: Monitor A/B test results

---

**No code changes needed - just configure your Plausible dashboard!** 🎉

All events are already firing correctly and validated at 100% (35/35 checks passed).
