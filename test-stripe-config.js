#!/usr/bin/env node

// Test script to verify Stripe configuration and $1 pricing
require('dotenv').config({ path: '.env.local' });

console.log('🧪 Testing Stripe Configuration for Production\n');

// Check environment variables
const requiredEnvVars = [
  'STRIPE_SECRET_KEY',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'NEXT_PUBLIC_BASE_URL'
];

console.log('📋 Environment Variables Check:');
let allEnvVarsPresent = true;

requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  if (value) {
    const displayValue = envVar.includes('SECRET') || envVar.includes('KEY') 
      ? value.substring(0, 10) + '...' 
      : value;
    console.log(`✅ ${envVar}: ${displayValue}`);
  } else {
    console.log(`❌ ${envVar}: MISSING`);
    allEnvVarsPresent = false;
  }
});

console.log('');

// Check Stripe key types
const secretKey = process.env.STRIPE_SECRET_KEY;
const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

console.log('🔑 Stripe Key Analysis:');
if (secretKey) {
  const isLiveSecret = secretKey.startsWith('sk_live_');
  const isTestSecret = secretKey.startsWith('sk_test_');
  console.log(`Secret Key Type: ${isLiveSecret ? '🟢 LIVE' : isTestSecret ? '🟡 TEST' : '❌ INVALID'}`);
} else {
  console.log('Secret Key Type: ❌ MISSING');
}

if (publishableKey) {
  const isLivePublishable = publishableKey.startsWith('pk_live_');
  const isTestPublishable = publishableKey.startsWith('pk_test_');
  console.log(`Publishable Key Type: ${isLivePublishable ? '🟢 LIVE' : isTestPublishable ? '🟡 TEST' : '❌ INVALID'}`);
} else {
  console.log('Publishable Key Type: ❌ MISSING');
}

// Check key consistency
if (secretKey && publishableKey) {
  const secretIsLive = secretKey.startsWith('sk_live_');
  const publishableIsLive = publishableKey.startsWith('pk_live_');
  
  if (secretIsLive === publishableIsLive) {
    console.log(`Key Consistency: ✅ ${secretIsLive ? 'Both LIVE' : 'Both TEST'}`);
  } else {
    console.log('Key Consistency: ❌ MISMATCH - Secret and Publishable keys are different types!');
    allEnvVarsPresent = false;
  }
}

console.log('');

// Test pricing function
console.log('💰 Pricing Function Test:');
try {
  // Import the pricing function
  const { getProductPricing } = require('./src/lib/printify-products.ts');
  
  const testPrice = getProductPricing('digital', 'digital', 'US', false);
  console.log(`Digital Product Price: ${testPrice} cents ($${(testPrice / 100).toFixed(2)})`);
  
  if (testPrice === 100) {
    console.log('✅ $1 override is ACTIVE');
  } else {
    console.log(`⚠️  $1 override NOT active - returning normal price: $${(testPrice / 100).toFixed(2)}`);
  }
} catch (error) {
  console.log(`❌ Pricing function error: ${error.message}`);
  allEnvVarsPresent = false;
}

console.log('');

// Final status
console.log('🎯 Overall Status:');
if (allEnvVarsPresent) {
  console.log('✅ Configuration looks good for production!');
  console.log('');
  console.log('🚀 Ready to test:');
  console.log('1. Start dev server: npm run dev');
  console.log('2. Navigate to artwork page');
  console.log('3. Try purchasing a product');
  console.log('4. Verify $1 charge in Stripe dashboard');
} else {
  console.log('❌ Configuration issues detected - fix before deploying!');
  console.log('');
  console.log('🔧 Next steps:');
  console.log('1. Check .env.local file exists');
  console.log('2. Ensure all required environment variables are set');
  console.log('3. Verify Stripe keys are consistent (both live or both test)');
  console.log('4. Re-run this test');
}
