#!/usr/bin/env node

// This will help us understand what's happening in production vs local

console.log('🔍 Environment Debug Information\n');

console.log('Current Environment Variables:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- NEXT_PUBLIC_BASE_URL:', process.env.NEXT_PUBLIC_BASE_URL);
console.log('- VERCEL:', process.env.VERCEL);
console.log('- VERCEL_URL:', process.env.VERCEL_URL);
console.log('- VERCEL_BRANCH_URL:', process.env.VERCEL_BRANCH_URL);
console.log('- VERCEL_PROJECT_PRODUCTION_URL:', process.env.VERCEL_PROJECT_PRODUCTION_URL);

console.log('\n🌐 URL Analysis:');
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
console.log('Configured Base URL:', baseUrl);

// Simulate what happens in checkout API
if (baseUrl) {
  const successUrl = `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${baseUrl}/cancel`;
  
  console.log('Generated URLs:');
  console.log('- Success URL:', successUrl);
  console.log('- Cancel URL:', cancelUrl);
}

console.log('\n🔧 Potential Issues:');
console.log('1. If accessing via Vercel URL but base URL is pawpopart.com:');
console.log('   - Stripe session created with pawpopart.com URLs');
console.log('   - Browser tries to access via Vercel URL');
console.log('   - Domain mismatch causes 401 errors');

console.log('\n2. If pawpopart.com DNS is not pointing to this deployment:');
console.log('   - Stripe redirects to pawpopart.com');
console.log('   - But pawpopart.com points to different/old deployment');
console.log('   - Session not found on target deployment');

console.log('\n3. If environment variables differ between local and production:');
console.log('   - Local .env.local might have different values');
console.log('   - Production Vercel environment might be different');
console.log('   - Check Vercel dashboard environment variables');

console.log('\n🎯 Next Steps:');
console.log('1. Check where pawpopart.com actually points');
console.log('2. Verify Vercel environment variables match local');
console.log('3. Test accessing via pawpopart.com instead of Vercel URL');
