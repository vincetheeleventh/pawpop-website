# Deploy Email-First Flow - Quick Start

## 🚀 5-Minute Deployment Guide

### Step 1: Apply Database Migration (2 min)

```bash
# Connect to your production database
cd supabase

# Apply migration
psql $DATABASE_URL -f migrations/018_add_deferred_upload_tracking.sql

# Verify migration succeeded
psql $DATABASE_URL -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'artworks' AND column_name = 'upload_token';"
```

**Expected Output**: Should return `upload_token` column

### Step 2: Update Homepage Component (1 min)

Find where `UploadModal` is used (likely in `/src/app/page.tsx`):

```typescript
// BEFORE:
import { UploadModal } from '@/components/forms/UploadModal';

// AFTER:
import { UploadModalEmailFirst } from '@/components/forms/UploadModalEmailFirst';

// Usage stays the same:
<UploadModalEmailFirst isOpen={showModal} onClose={() => setShowModal(false)} />
```

### Step 3: Configure Cron Job (1 min)

Add to project root `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/email/upload-reminder?send=true",
    "schedule": "0 */6 * * *"
  }]
}
```

**Or use external service**: Set up HTTP GET to `/api/email/upload-reminder?send=true` every 6 hours

### Step 4: Deploy (1 min)

```bash
# Commit changes
git add .
git commit -m "feat: implement email-first upload flow"

# Deploy to production
git push origin main
# or
vercel --prod
```

### Step 5: Test in Production (30 sec)

1. Visit your production site
2. Click "Create Masterpiece"
3. Enter test email
4. Choose "Upload Later"
5. Check test email received

## ✅ Verification Checklist

After deployment, verify:

- [ ] Database migration applied successfully
- [ ] New modal appears when clicking CTA
- [ ] Email capture works (check database)
- [ ] "Upload Now" flows to photo upload
- [ ] "Upload Later" sends confirmation email
- [ ] Email link works (test /upload/[token])
- [ ] Cron job scheduled (check Vercel dashboard)

## 📊 Monitor These Metrics

**First 24 Hours:**
- Email capture rate
- Email delivery rate (>95%)
- Any error logs

**First Week:**
- Deferred vs immediate upload ratio
- Reminder email open rates
- Deferred upload completion rate

**First Month:**
- Overall conversion improvement
- Revenue impact
- User satisfaction feedback

## 🆘 Quick Rollback (If Needed)

```bash
# 1. Revert modal change
git revert HEAD

# 2. Stop cron job
# Remove from vercel.json or disable external service

# 3. Rollback database (if necessary)
psql $DATABASE_URL -f supabase/rollbacks/018_rollback_deferred_upload_tracking.sql

# 4. Deploy rollback
git push origin main
```

## 📞 Support

- **Documentation**: `/docs/EMAIL_FIRST_FLOW_IMPLEMENTATION.md`
- **Integration Guide**: `/docs/INTEGRATION_CHECKLIST.md`
- **Summary**: `/docs/EMAIL_FIRST_FLOW_SUMMARY.md`

---

**Ready to deploy?** Follow steps 1-5 above and you're live! 🎉
