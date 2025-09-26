#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');

async function debugStripeDetailed() {
  console.log('🔍 Detailed Stripe Configuration Debug\n');

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  console.log('Environment Variables:');
  console.log('- Base URL:', baseUrl);
  console.log('- Secret Key:', secretKey ? secretKey.substring(0, 20) + '...' : 'MISSING');
  console.log('- Publishable Key:', publishableKey ? publishableKey.substring(0, 20) + '...' : 'MISSING');
  console.log('');

  if (!secretKey) {
    console.log('❌ Missing STRIPE_SECRET_KEY');
    return;
  }

  const stripe = new Stripe(secretKey);

  try {
    // Test 1: Check account details
    console.log('🏢 Testing Account Access...');
    const account = await stripe.accounts.retrieve();
    console.log('✅ Account ID:', account.id);
    console.log('✅ Account Type:', account.type);
    console.log('✅ Country:', account.country);
    console.log('✅ Default Currency:', account.default_currency);
    console.log('✅ Charges Enabled:', account.charges_enabled);
    console.log('✅ Payouts Enabled:', account.payouts_enabled);
    console.log('');

    // Test 2: Create minimal session
    console.log('💳 Creating Minimal Test Session...');
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'cad',
          product_data: {
            name: 'Debug Test Product',
          },
          unit_amount: 100,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/cancel`,
    });

    console.log('✅ Session Created Successfully!');
    console.log('- Session ID:', session.id);
    console.log('- Status:', session.status);
    console.log('- Payment Status:', session.payment_status);
    console.log('- Success URL:', session.success_url);
    console.log('- Cancel URL:', session.cancel_url);
    console.log('');

    // Test 3: Check if session can be retrieved
    console.log('🔍 Testing Session Retrieval...');
    const retrieved = await stripe.checkout.sessions.retrieve(session.id);
    console.log('✅ Session Retrieved Successfully!');
    console.log('- Retrieved ID:', retrieved.id);
    console.log('- Retrieved Status:', retrieved.status);
    console.log('');

    // Test 4: Check key permissions
    console.log('🔑 Testing Key Permissions...');
    
    // Try to list recent sessions (this requires read permissions)
    const recentSessions = await stripe.checkout.sessions.list({ limit: 1 });
    console.log('✅ Can list sessions:', recentSessions.data.length > 0 ? 'Yes' : 'No sessions found');
    
    console.log('');
    console.log('🎯 Direct Test URL (try this in incognito):');
    console.log(session.url);
    console.log('');
    console.log('📋 Key Analysis:');
    
    // Check key format
    if (secretKey.startsWith('sk_live_')) {
      console.log('✅ Using LIVE mode keys');
      if (publishableKey && publishableKey.startsWith('pk_live_')) {
        console.log('✅ Publishable key matches (LIVE)');
      } else {
        console.log('❌ Publishable key mismatch or missing');
      }
    } else if (secretKey.startsWith('sk_test_')) {
      console.log('⚠️  Using TEST mode keys');
      if (publishableKey && publishableKey.startsWith('pk_test_')) {
        console.log('✅ Publishable key matches (TEST)');
      } else {
        console.log('❌ Publishable key mismatch or missing');
      }
    } else {
      console.log('❌ Invalid secret key format');
    }

  } catch (error) {
    console.error('❌ Stripe API Error:');
    console.error('- Message:', error.message);
    console.error('- Type:', error.type);
    console.error('- Code:', error.code);
    console.error('- Status Code:', error.statusCode);
    
    if (error.type === 'StripeAuthenticationError') {
      console.error('\n🚨 Authentication Error Detected:');
      console.error('- Your Stripe secret key may be invalid or expired');
      console.error('- Check your Stripe dashboard for the correct keys');
      console.error('- Ensure the key has the necessary permissions');
    }
  }
}

debugStripeDetailed();
