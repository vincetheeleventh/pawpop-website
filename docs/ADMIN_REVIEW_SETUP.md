# Admin Review System Setup Guide

## Quick Setup

### 1. Environment Configuration

Copy the following variables to your `.env.local` file:

```bash
# Human-in-the-Loop Quality Control
ENABLE_HUMAN_REVIEW=true
ADMIN_EMAIL=pawpopart@gmail.com

# Monitoring System (optional but recommended)
MONITORING_SUPABASE_CONNECTION_THRESHOLD=80
MONITORING_SUPABASE_QUERY_TIME_THRESHOLD=5000
MONITORING_SUPABASE_ERROR_RATE_THRESHOLD=5
MONITORING_FAL_DAILY_COST_THRESHOLD=50
MONITORING_FAL_MONTHLY_COST_THRESHOLD=1000
MONITORING_FAL_ERROR_RATE_THRESHOLD=10
MONITORING_STRIPE_SUCCESS_RATE_THRESHOLD=95
MONITORING_STRIPE_PAYMENT_SUCCESS_RATE_THRESHOLD=98
```

### 2. Database Migration

Apply the admin review system migration:

```bash
# Apply the admin review system migration
# Note: Run this when your Supabase instance is in write mode
supabase migration up --file 003_add_admin_review_system.sql
supabase migration up --file 004_finalize_admin_review_system.sql
```

### 3. Test the System

Run the test suite to verify everything is working:

```bash
# Test core admin review functions
npm test -- tests/lib/admin-review-simple.test.ts

# Test API endpoints
npm test -- tests/api/admin-reviews-simple.test.ts

# Test all admin review components
npm test -- --grep "admin.review"
```

## Admin Dashboard Access

Once configured, access the admin dashboard at:

- **Main Dashboard**: `http://localhost:3000/admin/reviews`
- **Review Detail**: `http://localhost:3000/admin/reviews/[reviewId]`

## Review Workflow

### Artwork Proof Review
1. User uploads image → Artwork generated
2. **Review created** (if `ENABLE_HUMAN_REVIEW=true`)
3. Email sent to `ADMIN_EMAIL` with review link
4. Admin reviews and approves/rejects
5. Customer receives completion email (on approval)

### High-res File Review  
1. Customer purchases → Upscaling completes
2. **Review created** (if `ENABLE_HUMAN_REVIEW=true`)
3. Email sent to `ADMIN_EMAIL` with review link
4. Admin reviews and approves/rejects
5. Printify order created (on approval)

## Email Notifications

The system sends professional email notifications to `ADMIN_EMAIL` containing:

- Customer information (name, email, pet name)
- Direct link to review dashboard
- Artwork preview and fal.ai generation URL
- Review type (artwork_proof or highres_file)

## Monitoring Integration

The admin review system integrates with the monitoring system to track:

- Review processing times
- Approval/rejection rates
- System performance metrics
- Alert notifications for issues

## Disable the System

To return to fully automated operation:

```bash
# Set in .env.local
ENABLE_HUMAN_REVIEW=false
```

When disabled:
- No reviews are created
- Completion emails sent immediately
- Printify orders created automatically
- System operates in normal automated mode

## Troubleshooting

### Common Issues

1. **No email notifications**
   - Verify `RESEND_API_KEY` is configured
   - Check `ADMIN_EMAIL` is set correctly
   - Ensure domain is verified in Resend

2. **Reviews not appearing**
   - Check `ENABLE_HUMAN_REVIEW=true` in environment
   - Verify database migration was applied
   - Check Supabase connection and permissions

3. **Dashboard not loading**
   - Ensure all API routes are deployed
   - Check Supabase service role key permissions
   - Verify admin review functions exist in database

### Debug Commands

```bash
# Check environment configuration
npm run dev
# Visit http://localhost:3000/api/monitoring/health

# Test admin review functions
node -e "
const { isHumanReviewEnabled } = require('./src/lib/admin-review');
console.log('Human review enabled:', isHumanReviewEnabled());
"

# Check database schema
# In Supabase SQL Editor:
SELECT * FROM admin_reviews LIMIT 5;
SELECT * FROM pg_tables WHERE tablename = 'admin_reviews';
```

## Production Deployment

1. **Apply migrations** in production Supabase
2. **Set environment variables** in production deployment
3. **Verify email delivery** to admin email
4. **Test review workflow** with a sample artwork
5. **Monitor system performance** via monitoring dashboard

The admin review system is now ready for production use! 🎨✨
