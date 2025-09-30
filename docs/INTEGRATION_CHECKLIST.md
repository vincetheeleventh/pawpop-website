# Email-First Flow Integration Checklist

## Pre-Deployment Steps

### 1. Database Migration
```bash
# Apply the migration to your database
cd supabase
psql $DATABASE_URL -f migrations/018_add_deferred_upload_tracking.sql

# Verify migration
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'artworks' 
AND column_name IN ('email_captured_at', 'upload_deferred', 'upload_token', 'upload_reminder_count');
```

### 2. Replace UploadModal in Homepage

Update `/src/app/page.tsx` or wherever the upload modal is triggered:

```typescript
// OLD:
import { UploadModal } from '@/components/forms/UploadModal';

// NEW:
import { UploadModalEmailFirst } from '@/components/forms/UploadModalEmailFirst';

// Usage remains the same:
<UploadModalEmailFirst isOpen={isOpen} onClose={onClose} />
```

### 3. Environment Variables

Add to `.env.local` (production):
```bash
# Already have these:
RESEND_API_KEY=your_resend_key
NEXT_PUBLIC_BASE_URL=https://pawpopart.com
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Set this to false in production:
EMAIL_TEST_MODE=false
```

### 4. Set Up Cron Job

**Option A: Vercel Cron (Recommended)**

Create `vercel.json` in project root:
```json
{
  "crons": [{
    "path": "/api/email/upload-reminder?send=true",
    "schedule": "0 */6 * * *"
  }]
}
```

**Option B: External Service**
- Use cron-job.org or similar
- Set URL: `https://pawpopart.com/api/email/upload-reminder?send=true`
- Schedule: Every 6 hours
- Method: GET

### 5. Test in Staging

```bash
# 1. Test email capture
# Open modal, enter email, verify database record created

# 2. Test immediate upload
# Choose "Upload Now", upload photos, verify generation works

# 3. Test deferred upload
# Choose "Upload Later", check email received, click link, complete upload

# 4. Test reminder manually
curl -X POST https://your-staging.vercel.app/api/email/upload-reminder \
  -H "Content-Type: application/json" \
  -d '{
    "artworkId": "test-id",
    "customerName": "Test User",
    "customerEmail": "your-test-email@example.com",
    "uploadUrl": "https://your-staging.vercel.app/upload/test-token",
    "reminderNumber": 1
  }'
```

## Post-Deployment Monitoring

### Day 1: Launch Day
- [ ] Monitor email delivery rate (should be >95%)
- [ ] Check for any API errors in logs
- [ ] Verify cron job is running (check logs every 6 hours)
- [ ] Test complete flow end-to-end in production

### Day 2-3: Early Metrics
- [ ] Track email capture rate
- [ ] Monitor deferred vs immediate upload ratio
- [ ] Check reminder email open rates
- [ ] Watch for any user complaints/issues

### Week 1: Optimization
- [ ] Analyze funnel conversion rates
- [ ] Review reminder effectiveness (which reminder converts best)
- [ ] Identify any drop-off points
- [ ] A/B test email copy if needed

## Rollback Plan

If issues arise:

```bash
# 1. Switch back to old modal
# In homepage component, revert to:
import { UploadModal } from '@/components/forms/UploadModal';

# 2. Stop cron job
# Remove from vercel.json or disable external service

# 3. Rollback database (if needed)
psql $DATABASE_URL -f supabase/rollbacks/018_rollback_deferred_upload_tracking.sql
```

## Success Metrics

Track these in your analytics dashboard:

### Email Capture
- **Target**: 60-80% of modal opens capture email
- **Baseline**: ~30-40% (old flow with upload gate)
- **Expected Improvement**: +30-40 percentage points

### Deferred Upload Conversion
- **Target**: 20-30% of deferred uploads complete
- **Baseline**: N/A (new feature)
- **Key Factors**: Email timing, copy quality, reminder count

### Overall Conversion
- **Target**: +15-25% overall conversion rate
- **Calculation**: (Completed Artworks) / (Modal Opens)
- **Timeline**: 2-4 weeks to see statistical significance

## Quick Reference

### Database Queries

```sql
-- Check email capture rate
SELECT 
  COUNT(*) FILTER (WHERE email_captured_at IS NOT NULL) as emails_captured,
  COUNT(*) as total_artworks,
  ROUND(100.0 * COUNT(*) FILTER (WHERE email_captured_at IS NOT NULL) / COUNT(*), 2) as capture_rate
FROM artworks
WHERE created_at > NOW() - INTERVAL '7 days';

-- Check deferred upload stats
SELECT 
  upload_deferred,
  generation_step,
  COUNT(*) as count
FROM artworks
WHERE email_captured_at IS NOT NULL
GROUP BY upload_deferred, generation_step;

-- Check reminder effectiveness
SELECT 
  upload_reminder_count,
  COUNT(*) as sent,
  COUNT(*) FILTER (WHERE generation_step != 'pending') as completed,
  ROUND(100.0 * COUNT(*) FILTER (WHERE generation_step != 'pending') / COUNT(*), 2) as conversion_rate
FROM artworks
WHERE upload_deferred = true
GROUP BY upload_reminder_count
ORDER BY upload_reminder_count;
```

### API Testing

```bash
# Test email confirmation
curl -X POST http://localhost:3000/api/email/capture-confirmation \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Test User",
    "customerEmail": "test@example.com",
    "uploadUrl": "http://localhost:3000/upload/test-token"
  }'

# Test reminder scheduling
curl http://localhost:3000/api/email/upload-reminder

# Test reminder sending
curl http://localhost:3000/api/email/upload-reminder?send=true
```

## Troubleshooting

### Emails Not Sending
- Check `EMAIL_TEST_MODE` is false in production
- Verify Resend API key is valid
- Check Resend dashboard for delivery status
- Look for email domain verification issues

### Upload Links Not Working
- Verify token generation function works
- Check artwork record has `upload_token` field
- Ensure `/upload/[token]` route is deployed
- Test token validation logic

### Reminders Not Triggering
- Check cron job is configured and running
- Verify database function returns expected artworks
- Test manually via API endpoint
- Review logs for any errors

## Support Contacts

- **Technical Issues**: Check `/docs/EMAIL_FIRST_FLOW_IMPLEMENTATION.md`
- **Database Questions**: Review migration files in `/supabase/migrations/`
- **Email Issues**: Check Resend dashboard at resend.com
- **Analytics**: Review Plausible dashboard

---

**Last Updated**: 2025-01-29
**Status**: ✅ Ready for Deployment
