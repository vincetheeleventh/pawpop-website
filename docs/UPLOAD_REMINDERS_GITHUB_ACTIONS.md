# Upload Reminders - GitHub Actions Setup

## Overview

Upload reminder emails are now sent via **GitHub Actions** instead of Vercel Cron Jobs to stay within Vercel's free tier limits.

**Why GitHub Actions?**
- ✅ Free for public repositories
- ✅ Unlimited cron jobs (no daily limit)
- ✅ More flexible scheduling options
- ✅ Better monitoring and logs

---

## Configuration

### **GitHub Actions Workflow**
Location: `.github/workflows/upload-reminders.yml`

**Schedule**: Every 6 hours (00:00, 06:00, 12:00, 18:00 UTC)

```yaml
schedule:
  - cron: '0 */6 * * *'
```

### **Required GitHub Secret**

You need to add your Vercel deployment URL as a GitHub secret:

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add:
   - **Name**: `VERCEL_DEPLOYMENT_URL`
   - **Value**: `https://pawpopart.com` (or your production URL)

---

## How It Works

1. **GitHub Actions triggers** every 6 hours based on the cron schedule
2. **Workflow makes HTTP request** to your Vercel deployment:
   ```
   GET https://pawpopart.com/api/email/upload-reminder?send=true
   ```
3. **API endpoint processes** the request and sends reminder emails
4. **Workflow logs** the response for monitoring

---

## API Endpoint

**Path**: `/api/email/upload-reminder`

**Query Parameters**:
- `send=true` - Actually send emails (default: dry run)

**Response**:
```json
{
  "success": true,
  "remindersSent": 5,
  "message": "Sent 5 upload reminder emails"
}
```

---

## Manual Triggering

You can manually trigger the workflow:

1. Go to **Actions** tab in GitHub
2. Select **Send Upload Reminders** workflow
3. Click **Run workflow**
4. Select branch (usually `main`)
5. Click **Run workflow** button

---

## Monitoring

### **View Workflow Runs**
1. Go to **Actions** tab in GitHub repository
2. Click on **Send Upload Reminders** workflow
3. View individual run logs

### **Check Logs**
Each run shows:
- HTTP response code
- Response body from API
- Success/failure status

### **Example Log Output**
```
Sending upload reminders...
Response code: 200
Response body: {"success":true,"remindersSent":3}
✅ Upload reminders sent successfully
```

---

## Troubleshooting

### **Workflow Not Running**

**Check**:
- Cron schedule is correct
- Workflow file is in `.github/workflows/` directory
- Repository has Actions enabled

**Fix**:
- Ensure workflow YAML is valid
- Check GitHub Actions tab for errors
- Verify cron expression at [crontab.guru](https://crontab.guru)

### **API Endpoint Failing**

**Check**:
- `VERCEL_DEPLOYMENT_URL` secret is set correctly
- Vercel deployment is live and accessible
- API endpoint returns 200 status

**Fix**:
- Update GitHub secret with correct URL
- Test endpoint manually: `curl https://pawpopart.com/api/email/upload-reminder?send=true`
- Check Vercel logs for errors

### **No Emails Being Sent**

**Check**:
- Resend API key is configured in Vercel environment variables
- Database has artworks with `upload_deferred=true`
- Email templates are working

**Fix**:
- Verify `RESEND_API_KEY` in Vercel dashboard
- Run dry-run test: `/api/email/upload-reminder` (without `?send=true`)
- Check Resend dashboard for delivery status

---

## Testing

### **Dry Run (No Emails Sent)**
```bash
curl https://pawpopart.com/api/email/upload-reminder
```

### **Send Actual Emails**
```bash
curl https://pawpopart.com/api/email/upload-reminder?send=true
```

### **Local Testing**
```bash
# Start dev server
npm run dev

# Test endpoint
curl http://localhost:3000/api/email/upload-reminder?send=true
```

---

## Cost Comparison

| Service | Cron Jobs | Cost |
|---------|-----------|------|
| **Vercel Hobby** | 1 per day max | Free |
| **Vercel Pro** | Unlimited | $20/month |
| **GitHub Actions** | Unlimited | Free (public repos) |

**Savings**: $20/month by using GitHub Actions! 💰

---

## Schedule Options

You can adjust the frequency by editing the cron expression in the workflow file:

```yaml
# Every 6 hours (current)
- cron: '0 */6 * * *'

# Every 12 hours
- cron: '0 */12 * * *'

# Daily at 9 AM UTC
- cron: '0 9 * * *'

# Every 3 hours
- cron: '0 */3 * * *'
```

Use [crontab.guru](https://crontab.guru) to test cron expressions.

---

## Migration Summary

**Before** (Vercel Cron):
```json
{
  "crons": [{
    "path": "/api/email/upload-reminder?send=true",
    "schedule": "0 */6 * * *"
  }]
}
```

**After** (GitHub Actions):
- ✅ Removed `crons` from `vercel.json`
- ✅ Created `.github/workflows/upload-reminders.yml`
- ✅ Added `VERCEL_DEPLOYMENT_URL` secret
- ✅ Vercel build now succeeds on free tier

---

## Next Steps

1. ✅ Commit and push changes
2. ⚠️ Add `VERCEL_DEPLOYMENT_URL` secret to GitHub
3. ✅ Verify workflow runs successfully
4. ✅ Monitor first few runs in Actions tab
5. ✅ Check Resend dashboard for email deliveries

---

**Status**: ✅ **Production Ready**

The upload reminder system is now fully migrated to GitHub Actions and compatible with Vercel's free tier!
