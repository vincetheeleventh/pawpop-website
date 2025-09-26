#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');

async function deepDiveStripeIssue() {
  console.log('🔍 DEEP DIVE: Stripe Production vs Local Issue Analysis\n');

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    // Test 1: Compare session creation between environments
    console.log('1️⃣ TESTING SESSION CREATION DIFFERENCES\n');
    
    const testCases = [
      {
        name: 'Minimal Session (like other sites)',
        config: {
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
          success_url: 'https://www.pawpopart.com/success?session_id={CHECKOUT_SESSION_ID}',
          cancel_url: 'https://www.pawpopart.com/cancel',
        }
      },
      {
        name: 'Your Current Session (with metadata)',
        config: {
          payment_method_types: ['card'],
          line_items: [{
            price_data: {
              currency: 'cad',
              product_data: {
                name: 'PawPop Digital Download - digital',
                description: 'Custom pet portrait in Mona Lisa style',
              },
              unit_amount: 100,
            },
            quantity: 1,
          }],
          mode: 'payment',
          success_url: 'https://www.pawpopart.com/success?session_id={CHECKOUT_SESSION_ID}',
          cancel_url: 'https://www.pawpopart.com/artwork/test?cancelled=true',
          automatic_tax: { enabled: false },
          customer_email: 'test@example.com',
          metadata: {
            artworkId: 'test-123',
            productType: 'digital',
            size: 'digital',
            customerName: 'Test User',
            petName: 'Buddy',
            frameUpgrade: 'false',
            quantity: '1'
          }
        }
      }
    ];

    for (const testCase of testCases) {
      console.log(`\n📋 Testing: ${testCase.name}`);
      try {
        const session = await stripe.checkout.sessions.create(testCase.config);
        console.log(`✅ Session created: ${session.id}`);
        console.log(`   Status: ${session.status}`);
        console.log(`   Payment Status: ${session.payment_status}`);
        console.log(`   URL: ${session.url}`);
        
        // Test if session can be retrieved
        const retrieved = await stripe.checkout.sessions.retrieve(session.id);
        console.log(`✅ Session retrievable: ${retrieved.id === session.id}`);
        
        // Test URL accessibility
        const { exec } = require('child_process');
        const util = require('util');
        const execPromise = util.promisify(exec);
        
        try {
          const { stdout } = await execPromise(`curl -s -I "${session.url}" --max-time 5`);
          if (stdout.includes('200')) {
            console.log('✅ Session URL returns 200 OK');
          } else if (stdout.includes('401')) {
            console.log('❌ Session URL returns 401 Unauthorized');
          } else {
            console.log(`⚠️ Session URL returns: ${stdout.split('\n')[0]}`);
          }
        } catch (curlError) {
          console.log('⚠️ Could not test URL accessibility');
        }
        
      } catch (error) {
        console.log(`❌ Failed to create session: ${error.message}`);
      }
    }

    // Test 2: Check account restrictions that might affect checkout
    console.log('\n\n2️⃣ CHECKING ACCOUNT RESTRICTIONS\n');
    
    const account = await stripe.accounts.retrieve();
    console.log('Account Details:');
    console.log(`- ID: ${account.id}`);
    console.log(`- Country: ${account.country}`);
    console.log(`- Charges Enabled: ${account.charges_enabled}`);
    console.log(`- Payouts Enabled: ${account.payouts_enabled}`);
    
    if (account.requirements) {
      console.log('\nRequirements:');
      console.log(`- Currently Due: ${account.requirements.currently_due?.length || 0}`);
      console.log(`- Past Due: ${account.requirements.past_due?.length || 0}`);
      if (account.requirements.disabled_reason) {
        console.log(`- Disabled Reason: ${account.requirements.disabled_reason}`);
      }
    }

    // Test 3: Check for webhook endpoint conflicts
    console.log('\n\n3️⃣ CHECKING WEBHOOK CONFIGURATION\n');
    
    const webhooks = await stripe.webhookEndpoints.list();
    console.log(`Webhook Endpoints: ${webhooks.data.length}`);
    webhooks.data.forEach((webhook, i) => {
      console.log(`${i + 1}. ${webhook.url} - Status: ${webhook.status}`);
      console.log(`   Events: ${webhook.enabled_events.join(', ')}`);
    });

    // Test 4: Recent events that might indicate issues
    console.log('\n\n4️⃣ RECENT STRIPE EVENTS\n');
    
    const events = await stripe.events.list({ limit: 10 });
    console.log('Recent Events:');
    events.data.forEach((event, i) => {
      console.log(`${i + 1}. ${event.type} - ${new Date(event.created * 1000).toISOString()}`);
      if (event.type.includes('checkout') || event.type.includes('error')) {
        console.log(`   ⚠️ Checkout/Error event detected`);
      }
    });

    console.log('\n\n🎯 ANALYSIS SUMMARY:');
    console.log('1. If minimal session works but complex session fails → metadata/config issue');
    console.log('2. If both sessions fail → account/key issue');
    console.log('3. If sessions create but URLs return 401 → domain/webhook issue');
    console.log('4. Check for any account restrictions or webhook conflicts');

  } catch (error) {
    console.error('❌ Deep dive error:', error.message);
  }
}

deepDiveStripeIssue();
