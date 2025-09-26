#!/usr/bin/env node

// Debug script to check Stripe configuration
console.log('🔍 Stripe Configuration Debug\n');

// Check environment variables
console.log('Environment Variables:');
console.log('NODE_ENV:', process.env.NODE_ENV || 'undefined');
console.log('NEXT_PUBLIC_BASE_URL:', process.env.NEXT_PUBLIC_BASE_URL || 'undefined');

// Check Stripe keys
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_API_KEY;
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

console.log('\nStripe Keys:');
if (stripeSecretKey) {
  console.log('✅ STRIPE_SECRET_KEY found:', stripeSecretKey.substring(0, 10) + '...');
  console.log('   Key type:', stripeSecretKey.startsWith('sk_live_') ? 'LIVE' : 
                           stripeSecretKey.startsWith('sk_test_') ? 'TEST' : 'UNKNOWN');
} else {
  console.log('❌ STRIPE_SECRET_KEY missing');
}

if (stripePublishableKey) {
  console.log('✅ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY found:', stripePublishableKey.substring(0, 10) + '...');
  console.log('   Key type:', stripePublishableKey.startsWith('pk_live_') ? 'LIVE' : 
                             stripePublishableKey.startsWith('pk_test_') ? 'TEST' : 'UNKNOWN');
} else {
  console.log('❌ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY missing');
}

// Check key matching
if (stripeSecretKey && stripePublishableKey) {
  const secretIsLive = stripeSecretKey.startsWith('sk_live_');
  const publishableIsLive = stripePublishableKey.startsWith('pk_live_');
  
  if (secretIsLive === publishableIsLive) {
    console.log('✅ Keys match environment (both ' + (secretIsLive ? 'LIVE' : 'TEST') + ')');
  } else {
    console.log('❌ KEY MISMATCH! Secret is ' + (secretIsLive ? 'LIVE' : 'TEST') + 
                ' but Publishable is ' + (publishableIsLive ? 'LIVE' : 'TEST'));
  }
}

// Test Stripe initialization
console.log('\nTesting Stripe Initialization:');
try {
  const Stripe = require('stripe');
  if (stripeSecretKey) {
    const stripe = new Stripe(stripeSecretKey);
    console.log('✅ Stripe server client initialized successfully');
  } else {
    console.log('❌ Cannot initialize Stripe - no secret key');
  }
} catch (error) {
  console.log('❌ Stripe initialization failed:', error.message);
}

console.log('\n🔧 Recommendations:');
console.log('1. Ensure both keys are from the same Stripe environment (test or live)');
console.log('2. Verify keys are correctly set in your deployment environment');
console.log('3. Check that NEXT_PUBLIC_BASE_URL matches your domain');
console.log('4. Ensure webhook endpoints are configured in Stripe dashboard');
