# PawPop Production Deployment Guide

## 🚀 Going Live Checklist

This guide covers switching PawPop from development/test mode to full production mode with live Stripe payments and Resend email delivery.

## 1. Stripe Live Mode Configuration

### Update Environment Variables

Replace your test Stripe keys with live keys in your production environment:

```bash
# Stripe Configuration (LIVE MODE)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_actual_stripe_publishable_key
STRIPE_SECRET_KEY=sk_live_your_actual_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_actual_stripe_webhook_secret
```

### Stripe Dashboard Setup

1. **Switch to Live Mode** in your Stripe Dashboard
2. **Get Live API Keys**:
   - Go to Developers → API keys
   - Copy your live publishable key (starts with `pk_live_`)
   - Copy your live secret key (starts with `sk_live_`)

3. **Configure Webhooks**:
   - Go to Developers → Webhooks
   - Create new webhook endpoint: `https://pawpopart.com/api/webhook`
   - Select events: `checkout.session.completed`, `payment_intent.succeeded`
   - Copy the webhook signing secret (starts with `whsec_`)

4. **Test Payments**:
   - Use real credit card numbers (start with small amounts)
   - Verify order processing and Printify integration
   - Check email notifications

## 2. Resend Live Mode Configuration

### Update Environment Variables

```bash
# Email Configuration (Resend - LIVE MODE)
RESEND_API_KEY=re_your_actual_resend_api_key
NODE_ENV=production
EMAIL_TEST_MODE=false
```

### Resend Dashboard Setup

1. **Domain Verification**:
   - Verify your `pawpopart.com` domain in Resend
   - Add required DNS records (SPF, DKIM, DMARC)
   - Wait for verification (can take up to 24 hours)

2. **Email Templates**:
   - All emails will be sent from `hello@updates.pawpopart.com`
   - Admin emails go to `pawpopart@gmail.com`
   - Customer emails go to their actual email addresses

3. **Test Email Delivery**:
   - Send test emails to verify delivery
   - Check spam folders initially
   - Monitor delivery rates in Resend dashboard

## 3. Production Environment Variables

Complete `.env.local` file for production:

```bash
# Supabase (Production)
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_supabase_service_role_key

# Stripe Configuration (LIVE MODE)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_actual_stripe_publishable_key
STRIPE_SECRET_KEY=sk_live_your_actual_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_actual_stripe_webhook_secret

# Printify Configuration (Production)
PRINTIFY_API_TOKEN=your_production_printify_api_token
PRINTIFY_SHOP_ID=your_production_printify_shop_id
PRINTIFY_WEBHOOK_SECRET=your_production_printify_webhook_secret

# FAL.ai Configuration
FAL_KEY=your_fal_ai_api_key

# UploadThing Configuration (Live)
UPLOADTHING_SECRET=sk_live_your_uploadthing_secret
UPLOADTHING_APP_ID=your_uploadthing_app_id

# Email Configuration (Resend - LIVE MODE)
RESEND_API_KEY=re_your_actual_resend_api_key
NODE_ENV=production
EMAIL_TEST_MODE=false

# Application Configuration
NEXT_PUBLIC_BASE_URL=https://pawpopart.com

# Analytics (Production)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=pawpopart.com
NEXT_PUBLIC_PLAUSIBLE_SRC=https://plausible.io/js/script.file-downloads.hash.outbound-links.pageview-props.tagged-events.js

# Google Ads Conversion Tracking (Live)
NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID=AW-939186815
NEXT_PUBLIC_GOOGLE_ADS_PHOTO_UPLOAD_ID=AW-939186815/bSpECPPkoZ8bEP-0678D
NEXT_PUBLIC_GOOGLE_ADS_ARTWORK_GENERATION_ID=AW-939186815/g4XtCJeJnp8bEP-0678D
NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_ID=AW-939186815/zqMlCO-SoZ8bEP-0678D
NEXT_PUBLIC_GOOGLE_ADS_ARTWORK_VIEW_ID=AW-939186815/HI_4CMbKop8bEP-0678D

# Human-in-the-Loop Quality Control (PRODUCTION LAUNCH)
# Set to 'true' for initial launch with manual review
# Set to 'false' once confident in automated quality
ENABLE_HUMAN_REVIEW=true
ADMIN_EMAIL=pawpopart@gmail.com

# Monitoring System Configuration
MONITORING_SUPABASE_CONNECTION_THRESHOLD=80
MONITORING_SUPABASE_QUERY_TIME_THRESHOLD=5000
MONITORING_SUPABASE_ERROR_RATE_THRESHOLD=5
MONITORING_FAL_DAILY_COST_THRESHOLD=50
MONITORING_FAL_MONTHLY_COST_THRESHOLD=1000
MONITORING_FAL_ERROR_RATE_THRESHOLD=10
MONITORING_STRIPE_SUCCESS_RATE_THRESHOLD=95
MONITORING_STRIPE_PAYMENT_SUCCESS_RATE_THRESHOLD=98
```

## 4. Pre-Launch Testing Checklist

### End-to-End Flow Testing

- [ ] **Upload Flow**: Test image upload with real photos
- [ ] **Generation Pipeline**: Verify MonaLisa + Pet Integration works
- [ ] **Email Notifications**: Confirm both creation and completion emails
- [ ] **Artwork Pages**: Test unique artwork URLs and sharing
- [ ] **Purchase Flow**: Complete real purchase with live Stripe
- [ ] **Order Processing**: Verify Printify order creation
- [ ] **Admin Review**: Test manual approval workflow (if enabled)

### Payment Testing

- [ ] **Small Test Purchase**: $19.99 digital download
- [ ] **Physical Product**: Test art print or canvas order
- [ ] **International Orders**: Test shipping to different countries
- [ ] **Failed Payments**: Test declined card handling
- [ ] **Refund Process**: Verify refund capability in Stripe

### Email Delivery Testing

- [ ] **Domain Verification**: Confirm pawpopart.com is verified in Resend
- [ ] **Deliverability**: Test emails to Gmail, Yahoo, Outlook
- [ ] **Spam Testing**: Check spam folder placement
- [ ] **Admin Notifications**: Verify admin review emails work
- [ ] **Customer Journey**: Test complete email sequence

## 5. Monitoring & Alerts

### Health Checks

- [ ] **Supabase Connection**: Monitor database performance
- [ ] **FAL.ai Usage**: Track API costs and limits
- [ ] **Stripe Webhooks**: Monitor payment success rates
- [ ] **Email Delivery**: Track Resend delivery rates
- [ ] **Printify Integration**: Monitor order fulfillment

### Alert Configuration

All alerts are sent to `pawpopart@gmail.com`:

- **Critical**: Service outages, payment failures
- **High**: High error rates, cost thresholds exceeded
- **Medium**: Performance degradation
- **Low**: Informational alerts

## 6. Launch Day Procedures

### 1. Deploy to Production
```bash
# Build and deploy
npm run build
# Deploy to your hosting platform (Vercel, Netlify, etc.)
```

### 2. Verify All Systems
- [ ] Website loads correctly
- [ ] Upload functionality works
- [ ] Payment processing active
- [ ] Email notifications sending
- [ ] Admin dashboard accessible

### 3. Monitor Initial Traffic
- [ ] Watch error logs closely
- [ ] Monitor payment success rates
- [ ] Check email delivery rates
- [ ] Verify order fulfillment

### 4. Customer Support Ready
- [ ] Monitor `pawpopart@gmail.com` for issues
- [ ] Have refund process ready
- [ ] Prepare FAQ responses
- [ ] Set up customer service workflow

## 7. Post-Launch Optimization

### Week 1: Intensive Monitoring
- Daily review of all metrics
- Address any customer issues immediately
- Monitor conversion rates and user behavior
- Adjust manual review settings if needed

### Week 2-4: Performance Tuning
- Analyze conversion funnel data
- Optimize based on user feedback
- Consider disabling manual review if quality is consistent
- Scale up marketing efforts

### Month 2+: Growth Mode
- Implement A/B tests for optimization
- Expand product offerings
- Optimize for higher conversion rates
- Scale customer acquisition

## 8. Emergency Procedures

### If Payments Fail
1. Check Stripe dashboard for errors
2. Verify webhook endpoints are responding
3. Check environment variables are correct
4. Contact Stripe support if needed

### If Emails Stop Sending
1. Check Resend dashboard for delivery issues
2. Verify domain authentication status
3. Check rate limits and usage
4. Switch to backup email service if needed

### If Generation Pipeline Fails
1. Check FAL.ai API status and credits
2. Monitor Supabase database performance
3. Review error logs for specific failures
4. Enable manual review mode if needed

## 9. Success Metrics

### Key Performance Indicators
- **Conversion Rate**: Upload to purchase
- **Payment Success Rate**: >98%
- **Email Delivery Rate**: >95%
- **Order Fulfillment Rate**: >99%
- **Customer Satisfaction**: Monitor reviews and feedback

### Financial Metrics
- **Revenue per Customer**: Track average order value
- **Cost per Acquisition**: Monitor marketing spend efficiency
- **Profit Margins**: Track costs vs. revenue
- **Refund Rate**: Keep below 5%

---

## 🎉 You're Ready to Launch!

With this configuration, PawPop is ready for production with:
- ✅ Live Stripe payments
- ✅ Professional email delivery
- ✅ Complete order fulfillment
- ✅ Quality control systems
- ✅ Comprehensive monitoring
- ✅ Customer support readiness

**Good luck with your launch!** 🚀
