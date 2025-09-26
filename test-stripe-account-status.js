#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');

async function checkStripeAccountStatus() {
  console.log('🔍 Comprehensive Stripe Account Status Check\n');

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    // Get detailed account information
    const account = await stripe.accounts.retrieve();
    
    console.log('📊 Account Details:');
    console.log('- ID:', account.id);
    console.log('- Type:', account.type);
    console.log('- Country:', account.country);
    console.log('- Default Currency:', account.default_currency);
    console.log('- Business Type:', account.business_type);
    console.log('- Created:', new Date(account.created * 1000).toISOString());
    console.log('');

    console.log('💳 Capabilities:');
    console.log('- Charges Enabled:', account.charges_enabled);
    console.log('- Payouts Enabled:', account.payouts_enabled);
    console.log('- Card Payments:', account.capabilities?.card_payments);
    console.log('- Transfers:', account.capabilities?.transfers);
    console.log('');

    console.log('⚠️  Requirements & Restrictions:');
    if (account.requirements) {
      console.log('- Currently Due:', account.requirements.currently_due?.length || 0, 'items');
      console.log('- Eventually Due:', account.requirements.eventually_due?.length || 0, 'items');
      console.log('- Past Due:', account.requirements.past_due?.length || 0, 'items');
      
      if (account.requirements.currently_due?.length > 0) {
        console.log('- Currently Due Items:', account.requirements.currently_due);
      }
      if (account.requirements.disabled_reason) {
        console.log('- Disabled Reason:', account.requirements.disabled_reason);
      }
    }
    console.log('');

    // Check if account has any restrictions
    console.log('🚫 Account Restrictions:');
    if (account.restrictions) {
      console.log('- Inbound Transfers:', account.restrictions.inbound_transfers);
      console.log('- Outbound Transfers:', account.restrictions.outbound_transfers);
    } else {
      console.log('- No restrictions found');
    }
    console.log('');

    // Test creating a payment intent (more basic than checkout session)
    console.log('💰 Testing Payment Intent Creation...');
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 100,
      currency: 'cad',
      payment_method_types: ['card'],
    });
    
    console.log('✅ Payment Intent Created Successfully!');
    console.log('- ID:', paymentIntent.id);
    console.log('- Status:', paymentIntent.status);
    console.log('- Amount:', paymentIntent.amount, 'cents');
    console.log('- Currency:', paymentIntent.currency);
    console.log('');

    // Check recent events for any errors
    console.log('📋 Recent Account Events:');
    const events = await stripe.events.list({ limit: 5 });
    events.data.forEach((event, index) => {
      console.log(`${index + 1}. ${event.type} - ${new Date(event.created * 1000).toISOString()}`);
    });
    console.log('');

    // Test webhook endpoints if any
    console.log('🔗 Webhook Endpoints:');
    const webhooks = await stripe.webhookEndpoints.list();
    if (webhooks.data.length > 0) {
      webhooks.data.forEach((webhook, index) => {
        console.log(`${index + 1}. ${webhook.url} - Status: ${webhook.status}`);
      });
    } else {
      console.log('- No webhook endpoints configured');
    }
    console.log('');

    console.log('🎯 Diagnosis:');
    if (account.charges_enabled && account.payouts_enabled) {
      console.log('✅ Account appears fully functional');
      console.log('');
      console.log('🔍 If checkout is still failing, possible causes:');
      console.log('1. Network/ISP blocking Stripe checkout pages');
      console.log('2. Regional restrictions (some countries block payment processors)');
      console.log('3. Corporate firewall blocking Stripe domains');
      console.log('4. DNS issues resolving checkout.stripe.com');
      console.log('');
      console.log('🧪 Try these tests:');
      console.log('- Visit https://checkout.stripe.com directly');
      console.log('- Test from mobile data (different network)');
      console.log('- Test from different location/VPN');
      console.log('- Check if other Stripe-powered sites work (e.g., any SaaS subscriptions)');
    } else {
      console.log('⚠️  Account has restrictions that may affect checkout');
    }

  } catch (error) {
    console.error('❌ Error checking account status:');
    console.error('- Message:', error.message);
    console.error('- Type:', error.type);
    console.error('- Code:', error.code);
  }
}

checkStripeAccountStatus();
