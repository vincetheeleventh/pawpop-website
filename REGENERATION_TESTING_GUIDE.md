# Admin Regeneration Feature - Testing Guide

## ✅ Implementation Status

### Completed Components
- [x] Database migration file created (`023_add_regeneration_history.sql`)
- [x] Rollback file created (`023_rollback_regeneration_history.sql`)
- [x] API endpoint created (`/api/admin/reviews/[reviewId]/regenerate`)
- [x] Pet integration API updated to support prompt tweaks
- [x] Admin UI components built (presets, tweak textarea, history viewer)
- [x] TypeScript interfaces updated
- [x] Test suite created
- [x] Documentation written
- [x] Build verification: ✅ PASSED
- [x] Code committed and pushed to GitHub

### Pending Steps
- [ ] Run database migration in Supabase
- [ ] Test regeneration API end-to-end
- [ ] Verify UI components render correctly
- [ ] Test with real artwork regeneration

## 🗄️ Database Migration

### Step 1: Run Migration in Supabase Dashboard

**Option A: Use Supabase Dashboard**
1. Go to Supabase Dashboard → SQL Editor
2. Paste contents of `scripts/run-migration-023.sql`
3. Click "Run"
4. Verify column added in output

**Option B: Use Local Supabase CLI** (if available)
```bash
supabase db push
```

### Step 2: Verify Migration
Run the test script:
```bash
node scripts/test-regeneration.js
```

Expected output:
```
✅ regeneration_history column exists
✅ Found test review: [review-id]
✅ Source images available
✅ MonaLisa base available
```

## 🧪 Testing Checklist

### Pre-Testing Setup
- [ ] Development server running (`npm run dev`)
- [ ] Database migration applied
- [ ] At least one pending admin review exists
- [ ] FAL_KEY environment variable set (for actual regeneration)

### UI Component Tests

#### 1. Review Detail Page Load
```bash
# Open browser to:
http://localhost:3000/admin/reviews/[your-review-id]
```

**Verify:**
- [ ] Page loads without errors
- [ ] "Regenerate Artwork" section visible (purple theme)
- [ ] "MonaLisa Base Image" section visible (if monalisa_base_url exists)
- [ ] "Regeneration History" section NOT visible (empty history initially)

#### 2. Quick Preset Buttons
**Test each button:**
- [ ] "Make pet smaller" → Populates textarea
- [ ] "Make pet larger" → Populates textarea
- [ ] "Move pet left" → Populates textarea
- [ ] "Move pet right" → Populates textarea
- [ ] "Position higher" → Populates textarea
- [ ] "Position lower" → Populates textarea

**Verify:**
- [ ] Clicking button replaces existing text
- [ ] Textarea updates immediately
- [ ] Full prompt preview appears below

#### 3. Custom Prompt Tweak
**Test:**
- [ ] Type custom text in textarea
- [ ] Full prompt preview updates in real-time
- [ ] Preview shows base prompt + custom tweak
- [ ] Purple border preview box appears
- [ ] Preview text is italic and readable

#### 4. MonaLisa Base Checkbox
**Test:**
- [ ] Checkbox toggles on/off
- [ ] Label text clear: "Regenerate MonaLisa base too"
- [ ] Helper text explains the option
- [ ] State persists while typing

#### 5. MonaLisa Base Viewer
**Test:**
- [ ] Click to expand/collapse
- [ ] MonaLisa image displays correctly
- [ ] ChevronUp/ChevronDown icons toggle
- [ ] Image loads without errors

### API Endpoint Tests

#### 6. Regeneration API Structure
```bash
# Test API endpoint exists
curl -X POST http://localhost:3000/api/admin/reviews/[review-id]/regenerate \
  -H "Content-Type: application/json" \
  -d '{"prompt_tweak": "Make the pet smaller", "regenerate_monalisa": false}'
```

**Expected responses:**
- Without FAL_KEY: Error about missing API key
- With FAL_KEY: Regeneration starts (30-60s)

#### 7. End-to-End Regeneration Flow

**Test Scenario 1: Pet Integration Only (30-45s)**
1. Enter prompt tweak: "Make the pet smaller"
2. Leave "Regenerate MonaLisa base" unchecked
3. Click "Regenerate Artwork"
4. Verify:
   - [ ] Button shows "Regenerating..." with spinner
   - [ ] After 30-45s, new image appears
   - [ ] Success message displays
   - [ ] History section appears with 1 entry
   - [ ] History shows prompt tweak used
   - [ ] History shows "MonaLisa Reused" badge

**Test Scenario 2: Full Regeneration (60-90s)**
1. Enter prompt tweak: "Make the pet larger"
2. Check "Regenerate MonaLisa base"
3. Click "Regenerate Artwork"
4. Verify:
   - [ ] Button shows "Regenerating..." with spinner
   - [ ] After 60-90s, new image appears
   - [ ] Success message displays
   - [ ] History section shows 2 entries now
   - [ ] New entry shows "MonaLisa Regenerated" badge (purple)

**Test Scenario 3: No Prompt Tweak**
1. Leave textarea empty
2. Click "Regenerate Artwork"
3. Verify:
   - [ ] Uses base prompt only
   - [ ] Regeneration completes
   - [ ] History entry shows empty prompt_tweak

**Test Scenario 4: Quick Preset**
1. Click "Move pet left" preset
2. Click "Regenerate Artwork"
3. Verify:
   - [ ] Uses preset prompt
   - [ ] History saves "Move the pet to the left side"

#### 8. History Viewer Tests

**After multiple regenerations:**
- [ ] History section shows count (e.g., "Regeneration History (3)")
- [ ] Click to expand/collapse works
- [ ] Each entry shows:
  - [ ] Version number (Version 1, Version 2, etc.)
  - [ ] Timestamp (formatted correctly)
  - [ ] Prompt tweak (if any)
  - [ ] Badge (Regenerated vs Reused)
  - [ ] Thumbnail image
- [ ] Entries sorted by timestamp (newest first)
- [ ] Images load correctly

### Error Handling Tests

#### 9. Missing Source Images
**Test:**
1. Find review without source_images
2. Navigate to review detail page
3. Verify:
   - [ ] "Regenerate Artwork" button is disabled
   - [ ] Warning message: "Source images not available"

#### 10. API Failure Handling
**Test:**
1. Temporarily set invalid FAL_KEY
2. Try to regenerate
3. Verify:
   - [ ] Error message displays
   - [ ] Button re-enables
   - [ ] No partial history entry created

#### 11. Network Timeout
**Test:**
1. Kill dev server mid-regeneration
2. Verify:
   - [ ] Error message shows
   - [ ] UI recovers gracefully
   - [ ] Can retry after server restart

## 📊 Performance Tests

### Timing Benchmarks
- [ ] Pet integration only: 30-45 seconds
- [ ] MonaLisa + Pet integration: 60-90 seconds
- [ ] UI remains responsive during regeneration
- [ ] No browser freezing or blocking

### Load Tests
- [ ] Multiple rapid regenerations (5+ times)
- [ ] History array grows correctly
- [ ] No memory leaks in browser
- [ ] Images load efficiently

## 🔍 Code Quality Tests

### TypeScript Type Safety
```bash
npm run build
```
- [ ] No TypeScript errors
- [ ] All types properly defined
- [ ] AdminReview interface includes new fields

### Unit Tests
```bash
npm test tests/api/admin-regenerate.test.ts
```
- [ ] Prompt logic tests pass
- [ ] History structure tests pass

### Integration Tests
```bash
# Visual inspection of:
```
- [ ] No console errors in browser
- [ ] No React warnings
- [ ] Proper loading states
- [ ] Accessibility (keyboard navigation works)

## 🚀 Production Deployment Checklist

### Pre-Deployment
- [ ] All tests passing locally
- [ ] Database migration tested in development
- [ ] No console errors
- [ ] Build succeeds
- [ ] Git committed and pushed

### Deployment Steps
1. [ ] Run migration in production Supabase
   ```sql
   -- Run in Supabase Dashboard SQL Editor
   -- Contents of: supabase/migrations/023_add_regeneration_history.sql
   ```

2. [ ] Verify migration in production
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'admin_reviews' 
   AND column_name = 'regeneration_history';
   ```

3. [ ] Deploy code (auto-deploys from GitHub to Vercel)

4. [ ] Test in production
   - [ ] Navigate to production admin review page
   - [ ] Verify UI components render
   - [ ] Test regeneration with real review
   - [ ] Check production logs for errors

### Post-Deployment
- [ ] Monitor for errors in Vercel logs
- [ ] Check Supabase logs for query performance
- [ ] Verify FAL.ai API calls completing
- [ ] Test with team members

## 🐛 Troubleshooting

### Issue: "regeneration_history column does not exist"
**Solution:** Run migration in Supabase Dashboard

### Issue: "Source images not available"
**Solution:** Review must have pet_photo and pet_mom_photo in source_images

### Issue: Regeneration takes forever
**Cause:** MonaLisa regeneration adds 30-40 seconds
**Solution:** Uncheck "Regenerate MonaLisa base" for faster iterations

### Issue: Prompt tweak not affecting output
**Cause:** Tweak may be too subtle
**Solution:** Use more directive language (e.g., "Make the pet 50% smaller")

### Issue: History not showing
**Cause:** No regenerations performed yet
**Solution:** Regenerate at least once to populate history

## 📝 Test Results Log

### Test Run: [Date]
**Tester:** _______________________
**Environment:** [ ] Development [ ] Production

| Test | Status | Notes |
|------|--------|-------|
| Database migration | [ ] Pass [ ] Fail | |
| UI components render | [ ] Pass [ ] Fail | |
| Quick presets work | [ ] Pass [ ] Fail | |
| Custom prompt tweaks | [ ] Pass [ ] Fail | |
| Full prompt preview | [ ] Pass [ ] Fail | |
| MonaLisa checkbox | [ ] Pass [ ] Fail | |
| MonaLisa viewer | [ ] Pass [ ] Fail | |
| Regeneration (pet only) | [ ] Pass [ ] Fail | |
| Regeneration (full) | [ ] Pass [ ] Fail | |
| History viewer | [ ] Pass [ ] Fail | |
| Error handling | [ ] Pass [ ] Fail | |

**Overall Status:** [ ] Ready for Production [ ] Needs fixes

**Issues Found:**
_______________________
_______________________
_______________________

---

**Last Updated:** 2025-01-30
**Feature Status:** 🟡 Testing Phase
