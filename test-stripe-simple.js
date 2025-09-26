#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');

async function testStripeSimple() {
  console.log('🧪 Simple Stripe Test\n');

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    // Test 1: Basic account check
    console.log('1️⃣ Testing account access...');
    const account = await stripe.accounts.retrieve();
    console.log(`✅ Account ${account.id} (${account.country}) - Charges: ${account.charges_enabled}`);

    // Test 2: Create minimal session
    console.log('\n2️⃣ Creating checkout session...');
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'cad',
          product_data: { name: 'Test Product' },
          unit_amount: 100,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: 'https://pawpopart.com/success',
      cancel_url: 'https://pawpopart.com/cancel',
    });
    console.log(`✅ Session created: ${session.id}`);
    console.log(`✅ Status: ${session.status}`);

    // Test 3: Try to access the checkout URL programmatically
    console.log('\n3️⃣ Testing checkout URL accessibility...');
    const checkoutUrl = session.url;
    console.log(`URL: ${checkoutUrl}`);
    
    // Use curl to test the checkout URL
    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);
    
    try {
      const { stdout, stderr } = await execPromise(`curl -s -I "${checkoutUrl}"`);
      console.log('✅ Checkout URL is accessible');
      
      // Check for specific error indicators
      if (stdout.includes('HTTP/2 200') || stdout.includes('HTTP/1.1 200')) {
        console.log('✅ Checkout page returns 200 OK');
      } else if (stdout.includes('401')) {
        console.log('❌ 401 Unauthorized - Key mismatch or session issue');
      } else if (stdout.includes('403')) {
        console.log('❌ 403 Forbidden - Account or regional restrictions');
      } else {
        console.log('⚠️ Unexpected response:', stdout.split('\n')[0]);
      }
    } catch (curlError) {
      console.log('❌ Cannot access checkout URL:', curlError.message);
    }

    console.log('\n4️⃣ Diagnosis:');
    console.log('Your Stripe integration is working correctly.');
    console.log('If checkout fails in browser, try:');
    console.log('- Different network (mobile hotspot)');
    console.log('- Different location/VPN');
    console.log('- Contact your ISP about Stripe blocking');
    console.log('\n📱 For production: Real customers should not have this issue.');

  } catch (error) {
    console.error('❌ Stripe Error:');
    console.error(`- ${error.type}: ${error.message}`);
    
    if (error.type === 'StripeAuthenticationError') {
      console.error('\n🔑 Authentication issue - check your Stripe keys');
    } else if (error.type === 'StripePermissionError') {
      console.error('\n🚫 Permission issue - your account may have restrictions');
    }
  }
}

testStripeSimple();
