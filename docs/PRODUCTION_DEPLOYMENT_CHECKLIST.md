# Production Deployment Checklist for PawPop

## 🚨 Critical Issue Identified

**Problem**: Stripe checkout failing with "Something went wrong... payment provider cannot be reached"

**Root Cause**: Environment variables not properly configured in production environment

## ✅ Environment Variables Checklist

### Required Stripe Configuration
```bash
# Stripe LIVE keys (both must be from same environment)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_actual_key
STRIPE_SECRET_KEY=sk_live_your_actual_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Base URL (must match your domain)
NEXT_PUBLIC_BASE_URL=https://pawpopart.com
```

### Key Validation Rules
- ✅ Both keys must start with `pk_live_` and `sk_live_` for production
- ✅ Keys must be from the same Stripe account
- ✅ Webhook secret must match your Stripe webhook endpoint
- ✅ Base URL must match your actual domain (no trailing slash)

### Other Required Variables
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# FAL.ai
FAL_KEY=your_fal_ai_api_key

# UploadThing
UPLOADTHING_SECRET=sk_live_your_uploadthing_secret
UPLOADTHING_APP_ID=your_uploadthing_app_id

# Email (Resend)
RESEND_API_KEY=re_your_resend_api_key
NODE_ENV=production
EMAIL_TEST_MODE=false

# Printify
PRINTIFY_API_TOKEN=your_printify_api_token
PRINTIFY_SHOP_ID=your_printify_shop_id
PRINTIFY_WEBHOOK_SECRET=your_printify_webhook_secret
```

## 🔧 Debugging Steps

### 1. Run Environment Check
```bash
# In your production environment, run:
node debug-stripe.js
```

Expected output for working configuration:
```
✅ STRIPE_SECRET_KEY found: sk_live_...
   Key type: LIVE
✅ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY found: pk_live_...
   Key type: LIVE
✅ Keys match environment (both LIVE)
✅ Stripe server client initialized successfully
```

### 2. Test Checkout API Directly
```bash
# Test the checkout endpoint
curl -X POST https://pawpopart.com/api/checkout/artwork \
  -H "Content-Type: application/json" \
  -d '{
    "artworkId": "test",
    "productType": "digital",
    "size": "8x10",
    "customerEmail": "test@example.com",
    "customerName": "Test User",
    "imageUrl": "https://example.com/test.jpg",
    "testMode": true
  }'
```

### 3. Check Browser Console
Open browser dev tools and look for:
- Network tab: Check if API call returns 500 error
- Console tab: Look for Stripe loading errors
- Application tab: Verify environment variables are loaded

## 🚀 Deployment Platform Specific Instructions

### Vercel
1. Go to Project Settings → Environment Variables
2. Add all required variables with production values
3. Ensure `NEXT_PUBLIC_*` variables are added
4. Redeploy after adding variables

### Netlify
1. Go to Site Settings → Environment Variables
2. Add all required variables
3. Trigger new deployment

### Railway/Render/Other
1. Add environment variables in platform dashboard
2. Ensure all `NEXT_PUBLIC_*` variables are properly set
3. Redeploy application

## 🔍 Common Issues & Solutions

### Issue 1: "Payment provider cannot be reached"
**Cause**: Missing or invalid Stripe keys
**Solution**: 
- Verify both `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` are set
- Ensure both are live keys (`sk_live_` and `pk_live_`)
- Check keys are from same Stripe account

### Issue 2: "Stripe key environment mismatch"
**Cause**: Mixing test and live keys
**Solution**: Use either both test keys or both live keys, never mix

### Issue 3: Checkout redirects to wrong URL
**Cause**: Incorrect `NEXT_PUBLIC_BASE_URL`
**Solution**: Set to exact domain without trailing slash

### Issue 4: Webhook failures
**Cause**: Missing or incorrect webhook secret
**Solution**: 
- Copy webhook secret from Stripe Dashboard
- Set `STRIPE_WEBHOOK_SECRET` environment variable
- Ensure webhook endpoint is `https://yourdomain.com/api/webhook`

## 📋 Pre-Launch Verification

### Test Complete Flow
1. ✅ Upload photo → artwork generation works
2. ✅ Receive confirmation email
3. ✅ Click "Buy Now" → Stripe checkout loads
4. ✅ Complete test purchase
5. ✅ Receive order confirmation
6. ✅ Webhook processes order correctly

### Stripe Dashboard Checks
1. ✅ Webhook endpoint configured: `https://pawpopart.com/api/webhook`
2. ✅ Webhook events enabled: `checkout.session.completed`
3. ✅ Test mode disabled (using live keys)
4. ✅ Payment methods enabled (card payments)

### Security Checks
1. ✅ All API keys are live/production versions
2. ✅ No test keys in production environment
3. ✅ Webhook secrets properly configured
4. ✅ HTTPS enabled on all endpoints

## 🆘 Emergency Rollback

If checkout is completely broken:

1. **Enable Test Mode**: Add `testMode: true` to checkout requests
2. **Fallback Configuration**: Use test keys temporarily
3. **Monitor Logs**: Check server logs for specific error messages
4. **Contact Support**: Stripe support for key/webhook issues

## 📞 Support Contacts

- **Stripe Support**: https://support.stripe.com
- **Vercel Support**: https://vercel.com/help
- **Supabase Support**: https://supabase.com/support

---

**Next Steps**: 
1. Run `node debug-stripe.js` in production environment
2. Fix any missing environment variables
3. Test checkout flow end-to-end
4. Monitor error logs for 24 hours after deployment
