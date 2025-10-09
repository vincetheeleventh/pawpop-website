# Deferred Upload Fix - Verification Guide

## Problem Fixed
Users who deferred photo uploads were receiving email links that resulted in "Invalid or expired upload link" errors.

## Root Causes Identified
1. **Wrong token in email**: Deferred-upload emails were sending `access_token` instead of `upload_token`
2. **Missing deferred flag**: Artworks weren't being marked with `upload_deferred = true`
3. **Token generation gap**: No explicit `upload_token` was being generated before sending emails

## Solutions Implemented

### 1. Fixed UploadModal.tsx
- ✅ Set `upload_deferred: true` when creating artwork without photos
- ✅ Generate dedicated `upload_token` via `/api/artwork/generate-upload-token`
- ✅ Use `upload_token` (not `access_token`) in deferred-upload email

### 2. Fixed supabase-artworks.ts
- ✅ Include `upload_deferred`, `email_captured_at`, and `user_type` in artwork creation
- ✅ Properly pass through all parameters from API to database

### 3. Added Backward Compatibility
- ✅ `/api/artwork/by-upload-token` now falls back to `access_token` lookup
- ✅ Old email links with `access_token` will continue to work
- ✅ New emails will use proper `upload_token`

## Test Results

### Automated Tests ✅
All automated tests passing:
```bash
npm run test:deferred-upload
# or
node scripts/test-deferred-upload-fix.js
```

**Test Coverage:**
- ✅ New deferred flow with `upload_token` generation
- ✅ Backward compatibility with old `access_token` links
- ✅ Edge cases (invalid token, missing token)

### Manual Testing Checklist

#### Test 1: New Deferred Upload Flow
1. ✅ Open homepage and click "Upload Photo Now"
2. ✅ Skip both photo uploads (click "Skip for now" twice)
3. ✅ Enter name and email, submit
4. ✅ Verify success message: "We've sent you an email with a link to upload your photos"
5. ✅ Check email for deferred upload link
6. ✅ Click link - should load upload page with name/email prefilled
7. ✅ Verify no "Invalid or expired upload link" error

**Expected Database State:**
```sql
SELECT id, customer_email, upload_deferred, upload_token, access_token 
FROM artworks 
WHERE customer_email = 'test@example.com';

-- Should show:
-- upload_deferred: true
-- upload_token: <64-char token>
-- access_token: <64-char token>
```

#### Test 2: Backward Compatibility (Old Links)
1. ✅ Find an old deferred upload email with `access_token` in URL
2. ✅ Click the link
3. ✅ Verify upload page loads successfully (no error)
4. ✅ Verify name/email are prefilled

**Why This Works:**
The API now tries both `upload_token` and `access_token` lookups, so old links continue to function.

#### Test 3: Already Completed Upload
1. ✅ Use a deferred upload link
2. ✅ Complete the upload and generate artwork
3. ✅ Try to use the same link again
4. ✅ Verify friendly message: "This upload link has already been used. Check your email for your artwork!"

## Production Deployment Checklist

### Pre-Deployment
- [x] All automated tests passing
- [x] Manual testing completed locally
- [x] Code committed and pushed to main
- [ ] Verify production environment variables:
  - `NEXT_PUBLIC_BASE_URL=https://www.pawpopart.com`
  - `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` configured

### Post-Deployment
- [ ] Test new deferred flow in production
- [ ] Test old email link (if available) for backward compatibility
- [ ] Monitor logs for any `by-upload-token` errors
- [ ] Verify emails contain correct upload URLs

### Monitoring
Watch for these log messages:
```
✅ Generated upload token for deferred email
✅ Upload token validated successfully
⚠️  No artwork found by upload_token. Trying access_token fallback
```

## API Endpoints Modified

### POST /api/artwork/create
**Changes:**
- Now accepts and stores `upload_deferred`, `email_captured_at`, `user_type`

### POST /api/artwork/generate-upload-token
**Usage:**
- Generates secure upload token using database function
- Updates artwork record with token

### GET /api/artwork/by-upload-token
**Changes:**
- Primary lookup by `upload_token`
- Fallback to `access_token` for backward compatibility
- Validates `upload_deferred = true`
- Validates `generation_step = 'pending'`

## Database Functions Used

### generate_upload_token()
```sql
-- Creates secure 64-character token
-- Called by /api/artwork/generate-upload-token
```

## Files Modified
- `src/components/forms/UploadModal.tsx` - Fixed deferred flow
- `src/lib/supabase-artworks.ts` - Added missing fields to insert
- `src/app/api/artwork/by-upload-token/route.ts` - Added fallback lookup
- `scripts/test-deferred-upload-fix.js` - Comprehensive test suite

## Success Metrics
- ✅ Zero "Invalid or expired upload link" errors for valid tokens
- ✅ Old email links continue to work (backward compatible)
- ✅ New emails use proper `upload_token`
- ✅ Upload page loads successfully for deferred users

## Rollback Plan
If issues occur in production:

1. **Quick Fix**: Revert to using `access_token` in emails
   ```typescript
   // In UploadModal.tsx, line ~557
   uploadToken: access_token  // Temporary rollback
   ```

2. **Full Rollback**: Revert commits
   ```bash
   git revert HEAD~2  # Revert last 2 commits
   git push
   ```

## Support
If users report "Invalid or expired upload link" errors:

1. Check artwork record in database:
   ```sql
   SELECT * FROM artworks WHERE customer_email = 'user@example.com';
   ```

2. Verify fields:
   - `upload_deferred` should be `true`
   - `upload_token` should exist (64 chars)
   - `generation_step` should be `'pending'`

3. If token missing, generate manually:
   ```bash
   curl -X POST https://www.pawpopart.com/api/artwork/generate-upload-token \
     -H "Content-Type: application/json" \
     -d '{"artworkId": "ARTWORK_ID_HERE"}'
   ```

## Related Documentation
- [Email-First Flow Implementation](./EMAIL_FIRST_UPLOAD_FLOW.md)
- [Upload Reminders GitHub Actions](../UPLOAD_REMINDERS_GITHUB_ACTIONS.md)
- [Deferred Upload Tracking Migration](../../supabase/migrations/018_add_deferred_upload_tracking.sql)
