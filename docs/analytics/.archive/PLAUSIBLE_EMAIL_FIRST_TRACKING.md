# Plausible Analytics Tracking - Email-First Upload Flow

## Overview
This document maps all Plausible Analytics and Clarity tracking events for the new email-first upload modal (`UploadModalEmailFirst.tsx`), comparing it to the original implementation and highlighting the new email-first specific events.

## Tracking Events Mapping

### 1. Modal Opening (EXISTING)
**Event**: Modal opened
```typescript
trackFunnel.uploadModalOpened();
trackInteraction.modalOpen('Upload Modal - Email First');
clarityTracking.trackFunnel.uploadModalOpened();
```
**When**: User clicks "Create Your Masterpiece" button
**Location**: `useEffect` when `isOpen` becomes true

---

### 2. Email Capture (NEW - Email-First Flow)
**Events**: Email captured + Form completion
```typescript
trackFunnel.emailCaptured();
trackInteraction.formStart('Email Capture Form');
trackInteraction.formComplete('Email Capture Form');
clarityTracking.trackInteraction.formStarted('email_capture');
clarityTracking.trackInteraction.formCompleted('email_capture');
```
**When**: User submits name and email (Step 1 of email-first flow)
**Location**: `handleEmailCapture()` function
**New Funnel Step**: 2.5 in the conversion funnel

---

### 3. Upload Now Choice (NEW - Email-First Flow)
**Event**: Button click
```typescript
trackInteraction.buttonClick('Upload Now', 'upload-choice');
clarityTracking.trackInteraction.buttonClick('upload_now', 'upload-choice');
```
**When**: User chooses to upload photos immediately after email capture
**Location**: `handleUploadNow()` function

---

### 4. Upload Later Choice (NEW - Email-First Flow)
**Events**: Button click + Deferred upload + Form completion
```typescript
trackInteraction.buttonClick('Upload Later', 'upload-choice');
trackFunnel.deferredUpload();
trackInteraction.formComplete('Deferred Upload Choice');
clarityTracking.trackInteraction.buttonClick('upload_later', 'upload-choice');
clarityTracking.trackInteraction.formCompleted('deferred_upload');
```
**When**: User chooses to upload photos later (email link sent)
**Location**: `handleUploadLater()` function
**New Funnel Step**: 2.6 (deferred upload)

---

### 5. Photo Upload (EXISTING - Enhanced)
**Events**: Photo uploaded + Feature usage
```typescript
trackFunnel.photoUploaded(file.size, file.type);
trackInteraction.featureUsed('Photo Upload', {
  file_type: file.type,
  file_size_mb: Math.round(file.size / 1024 / 1024 * 100) / 100,
  upload_type: type,
  converted_from_heic: needsHeicConversion
});
clarityTracking.trackFunnel.photoUploaded(file.type, file.size);
```
**When**: User successfully uploads a photo (pet mom or pet)
**Location**: `handleFileUpload()` function
**Funnel Step**: 3

---

### 6. Artwork Generation Started (EXISTING - Updated)
**Events**: Generation started + Form start
```typescript
trackFunnel.artworkGenerationStarted();
trackInteraction.formStart('Upload Form - Email First');
clarityTracking.trackFunnel.artworkGenerationStarted();
```
**When**: User submits both photos and generation begins
**Location**: `handleSubmit()` function
**Funnel Step**: 4

---

### 7. Artwork Generation Completed (EXISTING - Enhanced with Manual Approval)
**Events**: Artwork completed + Form completion + Performance tracking + Google Ads
```typescript
// Google Ads conversion
const { trackArtworkGeneration } = await import('@/lib/google-ads');
trackArtworkGeneration(artworkId, 15); // $15 CAD qualified lead value

// Check for manual approval
const { isHumanReviewEnabled } = await import('@/lib/admin-review');

if (isHumanReviewEnabled()) {
  // Pending approval flow
  trackFunnel.artworkGenerationStarted();
  trackInteraction.formComplete('Upload Form - Email First - Pending Approval', generationTime);
  trackPerformance.imageGeneration('Full Artwork Pipeline - Email First - Pending Approval', generationTime, true);
} else {
  // Automated flow
  trackFunnel.artworkCompleted(generationTime);
  trackInteraction.formComplete('Upload Form - Email First', generationTime);
  trackPerformance.imageGeneration('Full Artwork Pipeline - Email First', generationTime, true);
}
```
**When**: Artwork generation completes successfully
**Location**: `handleSubmit()` function (after pet integration)
**Funnel Step**: 5
**Note**: Conditional tracking based on manual approval setting

---

### 8. Error Tracking (EXISTING - Updated)
**Events**: Error + Performance tracking
```typescript
trackInteraction.error('Upload Form Error - Email First', error.message);
trackPerformance.imageGeneration('Full Artwork Pipeline - Email First', generationTime, false);
clarityTracking.trackInteraction.errorOccurred('upload_form_error_email_first', error.message);
```
**When**: Any error occurs during the upload/generation process
**Location**: `handleSubmit()` catch block

---

### 9. Exit Intent Detection (EXISTING)
**Event**: Button click
```typescript
trackInteraction.buttonClick('Exit Intent Triggered', 'email-capture');
```
**When**: User moves mouse to top of screen (attempting to close modal)
**Location**: `useEffect` with `mouseleave` event listener
**Only Active**: During email capture step

---

## New Funnel Steps for Email-First Flow

### Complete Funnel Sequence:
1. **Landing Page View** (1)
2. **Upload Modal Opened** (2)
3. **Email Captured** (2.5) ← NEW
4. **Upload Deferred** (2.6) ← NEW (if "Upload Later" chosen)
5. **Deferred Upload Completed** (2.7) ← NEW (when they return via email)
6. **Photo Uploaded** (3)
7. **Artwork Generation Started** (4)
8. **Artwork Completed** (5)
9. **Artwork Page Viewed** (6)
10. **Purchase Modal Opened** (7)
11. **Product Selected** (8)
12. **Checkout Initiated** (9)
13. **Purchase Completed** (10)

## Integration with Google Ads

The email-first flow maintains full Google Ads integration:
- **Artwork Generation Completion**: $15 CAD qualified lead value
- Tracks with enhanced conversion data (email, name)
- Fires regardless of manual approval setting

## Integration with Clarity

All major events are also tracked in Microsoft Clarity:
- Email capture form interactions
- Upload choice decisions
- Photo uploads with file details
- Form completions
- Error tracking

## Comparison: Old vs New Flow

### Old Upload Modal Flow:
1. Open modal
2. Upload photos
3. Submit form
4. Generate artwork
5. Complete

### New Email-First Flow:
1. Open modal
2. **Capture email** ← NEW STEP
3. **Choose: Upload Now or Later** ← NEW DECISION POINT
4. Upload photos (now or later)
5. Submit form
6. Generate artwork
7. Complete

## Key Differences

### Email-First Benefits:
- **Earlier Conversion Point**: Email captured before photo upload
- **Lead Recovery**: Can follow up with users who defer upload
- **Reduced Friction**: Users can save progress and return later
- **Better Attribution**: Email captured at start of funnel

### New Tracking Capabilities:
- Track email capture rate (Step 2.5)
- Track upload deferral rate (how many choose "Upload Later")
- Track deferred upload completion rate (return rate from email)
- Distinguish between immediate and deferred uploads in analytics

## Analytics Dashboard Filters

Recommended filters for Plausible dashboard:

### Email-First Specific:
- `form_name` = "Email Capture Form"
- `button_name` = "Upload Now" or "Upload Later"
- `form_name` = "Deferred Upload Choice"

### Flow Comparison:
- `form_name` contains "Email First" (new flow)
- `form_name` = "Upload Form" (old flow)

### Manual Approval:
- `form_name` contains "Pending Approval"
- `form_name` contains "Email First"

## Testing Checklist

### Email Capture Flow:
- [ ] Email capture form submission tracked
- [ ] Email validation errors don't trigger tracking
- [ ] Form completion event fires

### Upload Choice Flow:
- [ ] "Upload Now" button click tracked
- [ ] "Upload Later" button click tracked
- [ ] Deferred upload funnel step tracked
- [ ] Email sent confirmation tracked

### Photo Upload Flow:
- [ ] Both pet mom and pet photo uploads tracked
- [ ] HEIC conversion tracked correctly
- [ ] File size and type captured

### Artwork Generation:
- [ ] Generation start tracked
- [ ] Google Ads conversion fires ($15 value)
- [ ] Manual approval conditional logic works
- [ ] Generation time captured
- [ ] Performance tracking fires

### Error Tracking:
- [ ] Email validation errors tracked
- [ ] File upload errors tracked
- [ ] Generation errors tracked with proper context

## Production Verification

After deployment, verify in Plausible dashboard:

1. **Email Capture Rate**: % of modal opens that complete email capture
2. **Upload Now vs Later**: Split between immediate and deferred uploads
3. **Deferred Upload Return Rate**: % of "Upload Later" users who complete upload
4. **Overall Funnel**: Complete flow from modal open to artwork completion
5. **Manual Approval Impact**: Compare completion rates with/without manual approval

## Environment Variables

Ensure these are set in production:
```bash
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=pawpopart.com
NEXT_PUBLIC_PLAUSIBLE_SRC=https://plausible.io/js/script.js
ENABLE_HUMAN_REVIEW=true  # or false for automated flow
```

## Notes

- All tracking is non-blocking and fails gracefully
- Event tracking includes price variant context from A/B testing
- Clarity tracking runs in parallel for session replay analysis
- Manual approval conditional logic ensures accurate funnel metrics
- Email-first tracking clearly labeled to distinguish from old flow
