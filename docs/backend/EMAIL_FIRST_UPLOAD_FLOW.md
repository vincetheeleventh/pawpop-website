# Email-First Upload Flow Documentation

## Overview

The email-first upload flow captures customer contact information before photo uploads, reducing friction and enabling deferred upload capabilities. This document details the complete user flow, email coordination, and technical implementation.

---

## User Flow Paths

### Path 1: Upload Now (Immediate Upload)
**User Journey:**
1. User clicks "Create Your Masterpiece" → Opens UploadModalEmailFirst
2. User enters name and email → Clicks "Continue"
3. System creates artwork record and generates upload token
4. User presented with choice: "Upload Now" or "I'll Upload Later"
5. User clicks "Upload Now"
6. Modal transitions to photo upload interface
7. User uploads pet mom photo and pet photo
8. System processes images through MonaLisa Maker pipeline
9. Artwork generation completes

**Emails Sent:**
- ✅ **Masterpiece Creating Email** - Sent immediately after upload completion
  - Subject: "Your PawPop Masterpiece is Being Created! 🎨"
  - Content: Confirmation that artwork is being created, 2-5 minute timeline
  - Includes: Customer name, estimated completion time
  - Sent via: `/api/upload/complete`

- ✅ **Masterpiece Ready Email** - Sent after admin approval (if ENABLE_HUMAN_REVIEW=true)
  - Subject: "Your Masterpiece is Ready! 🎨✨"
  - Content: Artwork is complete and ready to view
  - Includes: Direct link to artwork page, preview image
  - Sent via: `/api/admin/reviews/[reviewId]/process` (on approval)

**Database State:**
```javascript
{
  email_captured_at: "2025-01-29T10:00:00Z",
  upload_deferred: false,
  upload_completed_at: "2025-01-29T10:02:00Z",
  generation_step: "pet_integration" → "completed",
  source_images: {
    pet_photo: "https://...",
    pet_mom_photo: "https://..."
  }
}
```

---

### Path 2: Upload Later (Deferred Upload)
**User Journey:**
1. User clicks "Create Your Masterpiece" → Opens UploadModalEmailFirst
2. User enters name and email → Clicks "Continue"
3. System creates artwork record and generates upload token
4. User presented with choice: "Upload Now" or "I'll Upload Later"
5. User clicks "I'll Upload Later"
6. System marks artwork as deferred and sends confirmation email
7. Modal shows success message and closes after 5 seconds

**Emails Sent:**
- ✅ **Upload Confirmation Email** - Sent immediately after "Upload Later" choice
  - Subject: "Your PawPop Upload Link is Ready! 📸"
  - Content: Confirmation with unique upload link for later use
  - Includes: Customer name, upload URL with token, instructions
  - Sent via: `/api/email/capture-confirmation`
  - Upload URL format: `https://pawpopart.com/upload/{uploadToken}`

- ✅ **Upload Reminder Emails** - Sent automatically if user doesn't upload
  - **First Reminder**: 24 hours after email capture
  - **Second Reminder**: 48 hours after first reminder
  - **Third Reminder**: 48 hours after second reminder (final)
  - Subject: "Don't Forget Your PawPop Masterpiece! 🐾"
  - Content: Friendly reminder with upload link
  - Includes: Upload URL, customer name, time since capture
  - Sent via: Automated cron job calling `/api/email/upload-reminder`
  - Max reminders: 3 (configurable via `max_reminders` parameter)

**Database State (Deferred):**
```javascript
{
  email_captured_at: "2025-01-29T10:00:00Z",
  upload_deferred: true,
  upload_token: "abc123xyz789...",
  upload_reminder_sent_at: null,
  upload_reminder_count: 0,
  generation_step: "pending"
}
```

**When User Returns to Upload:**
1. User clicks upload link from email
2. Navigates to `/upload/{uploadToken}`
3. System validates token and loads artwork record
4. User uploads photos
5. System marks upload as completed: `upload_deferred: false`, `upload_completed_at: NOW()`
6. Artwork generation pipeline begins
7. **Masterpiece Creating Email** sent (same as Path 1)
8. **Masterpiece Ready Email** sent after completion (same as Path 1)

---

## Email Templates & Coordination

### 1. Upload Confirmation Email (Deferred Upload Choice)
**File:** `/src/lib/email.ts` → `sendUploadConfirmationEmail()`

**Trigger:** User clicks "I'll Upload Later"

**Content:**
```
Subject: Your PawPop Upload Link is Ready! 📸

Hi {customerName}!

Perfect! We've saved your spot. Upload your photos whenever you're ready using this link:

[Upload Your Photos Now]
{uploadUrl}

This link is unique to you and will remain active for 30 days.

What happens next:
1. Click the link above when you're ready
2. Upload your pet's photo and a reference photo
3. We'll create your custom masterpiece in 2-5 minutes
4. You'll receive an email when it's ready!

Questions? Reply to this email anytime.

The PawPop Team 🎨
```

**Technical Details:**
- API Endpoint: `POST /api/email/capture-confirmation`
- Parameters: `customerName`, `customerEmail`, `uploadUrl`
- Database Update: None (email only)

---

### 2. Upload Reminder Emails (Automated)
**File:** `/src/lib/email.ts` → `sendUploadReminderEmail()`

**Trigger:** Automated cron job for deferred uploads

**Schedule:**
- **Reminder 1:** 24 hours after email capture
- **Reminder 2:** 48 hours after Reminder 1
- **Reminder 3:** 48 hours after Reminder 2 (final)

**Content:**
```
Subject: Don't Forget Your PawPop Masterpiece! 🐾

Hi {customerName}!

We noticed you haven't uploaded your photos yet. Your custom pet portrait is just a few clicks away!

[Upload Your Photos Now]
{uploadUrl}

It only takes 2 minutes:
1. Upload your pet's photo
2. Upload a reference photo (like the Mona Lisa pose)
3. We'll create your masterpiece in 2-5 minutes

Your link expires in {daysRemaining} days.

Need help? Just reply to this email.

The PawPop Team 🎨
```

**Technical Details:**
- API Endpoint: `POST /api/email/upload-reminder`
- Database Function: `get_artworks_needing_reminders(hours_since_capture, max_reminders)`
- Tracking: Updates `upload_reminder_sent_at` and `upload_reminder_count`

**Cron Job Implementation:**
```javascript
// Example cron job (to be implemented)
// Run every 6 hours
async function sendUploadReminders() {
  const { data: artworks } = await supabase.rpc('get_artworks_needing_reminders', {
    hours_since_capture: 24,
    max_reminders: 3
  });

  for (const artwork of artworks) {
    await fetch('/api/email/upload-reminder', {
      method: 'POST',
      body: JSON.stringify({
        customerName: artwork.customer_name,
        customerEmail: artwork.customer_email,
        uploadUrl: `${baseUrl}/upload/${artwork.upload_token}`,
        artworkId: artwork.artwork_id
      })
    });

    // Mark reminder as sent
    await supabase.rpc('mark_reminder_sent', { 
      artwork_id_param: artwork.artwork_id 
    });
  }
}
```

---

### 3. Masterpiece Creating Email (Upload Completion)
**File:** `/src/lib/email.ts` → `sendMasterpieceCreatingEmail()`

**Trigger:** Photo upload completes (both immediate and deferred paths)

**Content:**
```
Subject: Your PawPop Masterpiece is Being Created! 🎨

Hi {customerName}!

Great news! We've received your photos and our artists are transforming your pet's photo using modern illustration tools with human finishing touches.

Your custom portrait will be ready in 2-5 minutes!

What's happening now:
✓ Photos received
🎨 Creating your masterpiece
📧 You'll get an email when it's ready

We'll send you another email as soon as your artwork is complete.

The PawPop Team 🎨
```

**Technical Details:**
- API Endpoint: `POST /api/upload/complete`
- Trigger: Called from UploadModal after successful generation
- Parameters: `customerName`, `customerEmail`, `artworkToken`

---

### 4. Masterpiece Ready Email (Generation Complete)
**File:** `/src/lib/email.ts` → `sendMasterpieceReadyEmail()`

**Trigger:** Admin approves artwork (if ENABLE_HUMAN_REVIEW=true) OR generation completes (if ENABLE_HUMAN_REVIEW=false)

**Content:**
```
Subject: Your Masterpiece is Ready! 🎨✨

Hi {customerName}!

Your custom pet portrait is complete and ready to view!

[View Your Masterpiece]
{artworkUrl}

What you can do now:
• View your artwork in full resolution
• Choose from 3 product options:
  - Digital Download ($29)
  - Art Print ($79)
  - Framed Canvas ($129)
• Add to cart and checkout

Your artwork link: {artworkUrl}

Questions? Reply to this email anytime.

The PawPop Team 🎨
```

**Technical Details:**
- API Endpoint: `POST /api/email/masterpiece-ready`
- Trigger Points:
  - Manual approval: `/api/admin/reviews/[reviewId]/process` (on approval)
  - Automatic: `/api/artwork/update` (when generation completes and review disabled)
- Parameters: `customerName`, `customerEmail`, `artworkUrl`, `artworkImageUrl`

---

### 5. Admin Review Notification Email (Internal)
**File:** `/src/lib/email.ts` → `sendAdminReviewNotificationEmail()`

**Trigger:** Artwork generation completes and ENABLE_HUMAN_REVIEW=true

**Recipient:** `pawpopart@gmail.com` (configured via ADMIN_EMAIL env var)

**Content:**
```
Subject: [ADMIN] New Artwork Ready for Review

New artwork requires review:

Customer: {customerName}
Email: {customerEmail}
Review Type: Artwork Proof

[Review Now]
{reviewUrl}

Artwork Preview:
{artworkImageUrl}

Generation Details:
- Created: {timestamp}
- Pet Photo: {petPhotoUrl}
- Pet Mom Photo: {petMomPhotoUrl}

Review Dashboard: {dashboardUrl}
```

**Technical Details:**
- API Endpoint: `POST /api/email/admin-review-notification`
- Trigger: Called from `/api/pet-integration/route.ts` after successful generation
- Parameters: `customerName`, `customerEmail`, `reviewUrl`, `artworkImageUrl`, `reviewType`

---

## Database Schema

### Artworks Table (Deferred Upload Columns)
```sql
-- Email capture tracking
email_captured_at TIMESTAMPTZ,           -- When email was first captured
upload_deferred BOOLEAN DEFAULT false,   -- True if user chose "Upload Later"
upload_token TEXT UNIQUE,                -- Unique token for deferred upload link

-- Reminder system
upload_reminder_sent_at TIMESTAMPTZ,     -- Timestamp of most recent reminder
upload_reminder_count INTEGER DEFAULT 0, -- Number of reminders sent (max 3)
upload_completed_at TIMESTAMPTZ,         -- When deferred upload was completed

-- Indexes
CREATE INDEX idx_artworks_upload_deferred 
ON artworks(upload_deferred, email_captured_at) 
WHERE upload_deferred = true;

CREATE INDEX idx_artworks_upload_token 
ON artworks(upload_token) 
WHERE upload_token IS NOT NULL;

CREATE INDEX idx_artworks_reminder_scheduling 
ON artworks(upload_reminder_sent_at, upload_reminder_count) 
WHERE upload_deferred = true AND generation_step = 'pending';
```

### Database Functions

#### 1. Generate Upload Token
```sql
CREATE OR REPLACE FUNCTION generate_upload_token()
RETURNS TEXT AS $$
DECLARE
  token TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate random 32-character token
    token := encode(gen_random_bytes(24), 'base64');
    token := replace(replace(replace(token, '+', ''), '/', ''), '=', '');
    token := substring(token, 1, 32);
    
    -- Check if token already exists
    SELECT EXISTS(SELECT 1 FROM artworks WHERE upload_token = token) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  
  RETURN token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 2. Get Artworks Needing Reminders
```sql
CREATE OR REPLACE FUNCTION get_artworks_needing_reminders(
  hours_since_capture INTEGER DEFAULT 24,
  max_reminders INTEGER DEFAULT 3
)
RETURNS TABLE (
  artwork_id TEXT,
  customer_email TEXT,
  customer_name TEXT,
  email_captured_at TIMESTAMPTZ,
  upload_reminder_count INTEGER,
  upload_token TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.customer_email,
    a.customer_name,
    a.email_captured_at,
    a.upload_reminder_count,
    a.upload_token
  FROM artworks a
  WHERE a.upload_deferred = true
    AND a.generation_step = 'pending'
    AND a.upload_reminder_count < max_reminders
    AND (
      -- First reminder: 24 hours after capture
      (a.upload_reminder_count = 0 AND a.email_captured_at < NOW() - (hours_since_capture || ' hours')::INTERVAL)
      OR
      -- Subsequent reminders: 48 hours after last reminder
      (a.upload_reminder_count > 0 AND a.upload_reminder_sent_at < NOW() - INTERVAL '48 hours')
    )
  ORDER BY a.email_captured_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 3. Mark Reminder Sent
```sql
CREATE OR REPLACE FUNCTION mark_reminder_sent(artwork_id_param TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE artworks
  SET 
    upload_reminder_sent_at = NOW(),
    upload_reminder_count = upload_reminder_count + 1,
    updated_at = NOW()
  WHERE id = artwork_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 4. Complete Deferred Upload
```sql
CREATE OR REPLACE FUNCTION complete_deferred_upload(artwork_id_param TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE artworks
  SET 
    upload_deferred = false,
    upload_completed_at = NOW(),
    updated_at = NOW()
  WHERE id = artwork_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## API Endpoints

### 1. Create Artwork (Email Capture)
**Endpoint:** `POST /api/artwork/create`

**Request:**
```json
{
  "customer_name": "John Doe",
  "customer_email": "john@example.com",
  "email_captured_at": "2025-01-29T10:00:00Z",
  "upload_deferred": false
}
```

**Response:**
```json
{
  "artwork": {
    "id": "uuid-here",
    "customer_name": "John Doe",
    "customer_email": "john@example.com",
    "email_captured_at": "2025-01-29T10:00:00Z",
    "generation_step": "pending"
  },
  "access_token": "token-here"
}
```

---

### 2. Generate Upload Token
**Endpoint:** `POST /api/artwork/generate-upload-token`

**Request:**
```json
{
  "artworkId": "uuid-here"
}
```

**Response:**
```json
{
  "success": true,
  "uploadToken": "abc123xyz789..."
}
```

**Implementation:**
- Calls database function `generate_upload_token()`
- Updates artwork record with token
- Returns token for email link generation

---

### 3. Get Artwork by Upload Token
**Endpoint:** `GET /api/artwork/by-upload-token?token={uploadToken}`

**Response:**
```json
{
  "artwork": {
    "id": "uuid-here",
    "customer_name": "John Doe",
    "customer_email": "john@example.com",
    "upload_deferred": true,
    "upload_token": "abc123xyz789...",
    "generation_step": "pending"
  }
}
```

**Usage:** Called when user visits `/upload/{uploadToken}` to validate token and load artwork

---

### 4. Send Upload Confirmation Email
**Endpoint:** `POST /api/email/capture-confirmation`

**Request:**
```json
{
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "uploadUrl": "https://pawpopart.com/upload/abc123xyz789"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Confirmation email sent successfully"
}
```

---

### 5. Send Upload Reminder Email
**Endpoint:** `POST /api/email/upload-reminder`

**Request:**
```json
{
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "uploadUrl": "https://pawpopart.com/upload/abc123xyz789",
  "artworkId": "uuid-here",
  "reminderNumber": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Reminder email sent successfully"
}
```

**Post-Send Action:** Calls `mark_reminder_sent(artworkId)` to update database

---

## Component Implementation

### UploadModalEmailFirst.tsx

**Key States:**
```typescript
const [flowStep, setFlowStep] = useState<'email-capture' | 'upload-choice' | 'photo-upload' | 'complete'>('email-capture')
const [artworkId, setArtworkId] = useState<string | null>(null)
const [uploadToken, setUploadToken] = useState<string | null>(null)
const [formData, setFormData] = useState({ name: '', email: '' })
```

**Flow Steps:**

1. **Email Capture Step** (`flowStep === 'email-capture'`)
   - User enters name and email
   - Validates email format
   - Calls `/api/artwork/create` to create artwork record
   - Calls `/api/artwork/generate-upload-token` to generate token
   - Sets `artworkId` and `uploadToken` state
   - Transitions to `upload-choice` step

2. **Upload Choice Step** (`flowStep === 'upload-choice'`)
   - Presents two buttons: "Upload Now" and "I'll Upload Later"
   - **Upload Now:** Transitions to `photo-upload` step
   - **Upload Later:** 
     - Calls `/api/artwork/update` to set `upload_deferred: true`
     - Calls `/api/email/capture-confirmation` to send email
     - Shows success message
     - Closes modal after 5 seconds

3. **Photo Upload Step** (`flowStep === 'photo-upload'`)
   - Shows UploadThing file upload interface
   - User uploads pet mom photo and pet photo
   - Calls `/api/upload/complete` after successful upload
   - Triggers artwork generation pipeline
   - Sends "Masterpiece Creating" email

4. **Complete Step** (`flowStep === 'complete'`)
   - Shows success message
   - Closes modal automatically

---

## Environment Variables

```bash
# Email Configuration
RESEND_API_KEY=re_...                    # Resend API key for sending emails
ADMIN_EMAIL=pawpopart@gmail.com          # Admin email for review notifications

# Feature Toggles
ENABLE_HUMAN_REVIEW=true                 # Enable manual approval workflow
ENABLE_EMAIL_FIRST_FLOW=true             # Enable email-first upload modal

# Email Domain
NEXT_PUBLIC_BASE_URL=https://pawpopart.com  # Base URL for email links
```

---

## Testing & Verification

### Manual Testing Checklist

**Path 1: Upload Now**
- [ ] Enter email and click Continue
- [ ] Verify artwork record created in database
- [ ] Verify upload token generated
- [ ] Click "Upload Now"
- [ ] Upload photos successfully
- [ ] Verify "Masterpiece Creating" email received
- [ ] Wait for generation to complete
- [ ] Verify "Masterpiece Ready" email received (if manual review disabled)
- [ ] Verify admin notification email sent (if manual review enabled)

**Path 2: Upload Later**
- [ ] Enter email and click Continue
- [ ] Verify artwork record created in database
- [ ] Verify upload token generated
- [ ] Click "I'll Upload Later"
- [ ] Verify confirmation email received with upload link
- [ ] Click upload link from email
- [ ] Verify redirected to `/upload/{token}` page
- [ ] Upload photos successfully
- [ ] Verify `upload_deferred` set to false in database
- [ ] Verify "Masterpiece Creating" email received
- [ ] Verify "Masterpiece Ready" email received after completion

**Reminder System**
- [ ] Create deferred upload (don't complete)
- [ ] Wait 24 hours (or manually trigger reminder job)
- [ ] Verify first reminder email received
- [ ] Wait 48 hours
- [ ] Verify second reminder email received
- [ ] Wait 48 hours
- [ ] Verify third (final) reminder email received
- [ ] Verify no more reminders sent after 3rd

---

## Error Handling

### Upload Token Generation Failure
```typescript
if (!tokenResponse.ok) {
  const tokenError = await tokenResponse.json();
  throw new Error(tokenError.error || 'Failed to generate upload token');
}
```
**User Impact:** Shows error message, prevents progression to upload choice step

### Email Sending Failure
```typescript
try {
  await fetch('/api/email/capture-confirmation', { ... });
} catch (error) {
  console.error('Failed to send confirmation email:', error);
  // Continue anyway - user can still use the upload link
}
```
**User Impact:** Process continues, user can still access upload via direct URL

### Invalid Upload Token
```typescript
if (!artwork || !artwork.upload_token) {
  return <div>Invalid or expired upload link</div>;
}
```
**User Impact:** Shows error page, prompts user to start over

---

## Migration Guide

### Applying Migration 018

**File:** `supabase/migrations/018_add_deferred_upload_tracking.sql`

**Apply via Supabase Dashboard:**
1. Go to Supabase Dashboard → SQL Editor
2. Copy entire migration file
3. Paste and run
4. Verify with: `SELECT * FROM artworks LIMIT 1;` (should show new columns)

**Verify Installation:**
```bash
node scripts/check-upload-token-function.js
```

Expected output:
```
✅ Function exists and works! Generated token: abc123xyz789...
✅ Column upload_token exists in artworks table
```

---

## Future Enhancements

### Planned Features
1. **SMS Notifications** - Send upload reminders via SMS for higher engagement
2. **Reminder Customization** - Allow users to set preferred reminder schedule
3. **Upload Progress Tracking** - Show progress bar during deferred upload completion
4. **Email Preferences** - Allow users to opt-out of reminder emails
5. **Analytics Integration** - Track conversion rates for immediate vs deferred uploads

### Monitoring & Analytics
- Track email open rates for each email type
- Monitor conversion rates: email capture → upload completion
- Track reminder effectiveness (which reminder number converts best)
- Monitor token expiration and renewal requests

---

## Support & Troubleshooting

### Common Issues

**Issue:** User doesn't receive confirmation email
- Check Resend API key is configured
- Verify email domain is verified in Resend
- Check spam folder
- Verify email address is valid

**Issue:** Upload token invalid or expired
- Tokens are valid for 30 days
- Check database for token existence
- Verify token matches URL parameter exactly

**Issue:** Reminders not being sent
- Verify cron job is running
- Check database function `get_artworks_needing_reminders()` returns results
- Verify `upload_reminder_count < 3`
- Check `email_captured_at` timestamp is old enough

### Debug Commands

**Check deferred uploads:**
```sql
SELECT id, customer_email, email_captured_at, upload_deferred, upload_reminder_count
FROM artworks
WHERE upload_deferred = true
ORDER BY email_captured_at DESC;
```

**Check artworks needing reminders:**
```sql
SELECT * FROM get_artworks_needing_reminders(24, 3);
```

**Manually trigger reminder:**
```bash
node scripts/send-upload-reminder.js --artwork-id=uuid-here
```

---

## Conclusion

The email-first upload flow provides a flexible, user-friendly experience that reduces friction while maintaining high conversion rates. The coordinated email system ensures users are informed at every step, with automated reminders for deferred uploads to maximize completion rates.

**Key Benefits:**
- ✅ Reduced friction - capture email before photo upload
- ✅ Deferred upload option - users can upload later
- ✅ Automated reminders - maximize upload completion
- ✅ Professional communication - clear expectations at every step
- ✅ Flexible workflow - supports both immediate and deferred paths
- ✅ Complete tracking - monitor conversion at every stage
