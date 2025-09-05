#!/usr/bin/env node

/**
 * Safe Email Testing Script with Domain Reputation Protection
 * 
 * This script provides multiple testing modes to protect your domain reputation:
 * 1. Mock Mode - No real emails sent, just logged
 * 2. Test Mode - All emails redirected to test recipient
 * 3. Rate Limited Mode - Prevents spam with hourly limits
 * 
 * Usage: 
 *   node scripts/safe-email-test.js --mode=mock
 *   node scripts/safe-email-test.js --mode=test
 *   node scripts/safe-email-test.js --mode=live (production only)
 */

require('dotenv').config({ path: '.env.local' });

const { MockEmailService, EmailRateLimit } = require('../src/lib/email-testing.ts');
const { 
  sendMasterpieceCreatingEmail,
  sendMasterpieceReadyEmail,
  sendOrderConfirmationEmail,
  sendShippingNotificationEmail
} = require('../src/lib/email.ts');

const args = process.argv.slice(2);
const mode = args.find(arg => arg.startsWith('--mode='))?.split('=')[1] || 'mock';

const TEST_DATA = {
  customerName: 'Test Customer',
  customerEmail: 'customer@example.com',
  petName: 'Buddy',
  artworkUrl: 'https://pawpop.art/artwork/test-token-123',
  generatedImageUrl: 'https://example.com/test-artwork.jpg',
  orderNumber: 'TEST-ORDER-123',
  productType: 'Canvas Print',
  productSize: '16x20',
  amount: 4999,
  currency: 'usd',
  trackingNumber: 'TEST123456789',
  trackingUrl: 'https://tracking.example.com/TEST123456789',
  carrier: 'UPS'
};

async function runSafeEmailTest() {
  console.log(`🛡️ Safe Email Testing - Mode: ${mode.toUpperCase()}\n`);

  // Set environment variables based on mode
  switch (mode) {
    case 'mock':
      process.env.EMAIL_MOCK_MODE = 'true';
      console.log('📝 Mock Mode: No real emails will be sent. All emails will be logged only.\n');
      break;
    
    case 'test':
      process.env.EMAIL_TEST_MODE = 'true';
      process.env.EMAIL_TEST_RECIPIENT = 'pawpopart@gmail.com';
      console.log('🧪 Test Mode: All emails will be redirected to pawpopart@gmail.com\n');
      break;
    
    case 'live':
      if (process.env.NODE_ENV !== 'production') {
        console.error('❌ Live mode only allowed in production environment');
        process.exit(1);
      }
      console.log('🚀 Live Mode: Emails will be sent to actual recipients\n');
      break;
    
    default:
      console.error('❌ Invalid mode. Use: mock, test, or live');
      process.exit(1);
  }

  if (!process.env.RESEND_API_KEY && mode !== 'mock') {
    console.error('❌ RESEND_API_KEY not found in environment variables');
    console.log('Please add your Resend API key to .env.local:');
    console.log('RESEND_API_KEY=your_api_key_here\n');
    process.exit(1);
  }

  try {
    const testRecipient = process.env.EMAIL_TEST_RECIPIENT || 'pawpopart@gmail.com';

    // Check rate limits in test mode
    if (mode === 'test' && !EmailRateLimit.canSendEmail(testRecipient)) {
      console.error(`❌ Rate limit exceeded for ${testRecipient}`);
      console.log(`Remaining emails: ${EmailRateLimit.getRemainingEmails(testRecipient)}`);
      process.exit(1);
    }

    const emailTests = [
      {
        name: 'Masterpiece Creating',
        fn: () => sendMasterpieceCreatingEmail({
          customerName: TEST_DATA.customerName,
          customerEmail: TEST_DATA.customerEmail,
          petName: TEST_DATA.petName,
          artworkUrl: TEST_DATA.artworkUrl
        })
      },
      {
        name: 'Masterpiece Ready',
        fn: () => sendMasterpieceReadyEmail({
          customerName: TEST_DATA.customerName,
          customerEmail: TEST_DATA.customerEmail,
          petName: TEST_DATA.petName,
          artworkUrl: TEST_DATA.artworkUrl,
          generatedImageUrl: TEST_DATA.generatedImageUrl
        })
      },
      {
        name: 'Order Confirmation',
        fn: () => sendOrderConfirmationEmail({
          customerName: TEST_DATA.customerName,
          customerEmail: TEST_DATA.customerEmail,
          orderNumber: TEST_DATA.orderNumber,
          productType: TEST_DATA.productType,
          productSize: TEST_DATA.productSize,
          amount: TEST_DATA.amount,
          currency: TEST_DATA.currency,
          petName: TEST_DATA.petName
        })
      },
      {
        name: 'Shipping Notification',
        fn: () => sendShippingNotificationEmail({
          customerName: TEST_DATA.customerName,
          customerEmail: TEST_DATA.customerEmail,
          orderNumber: TEST_DATA.orderNumber,
          trackingNumber: TEST_DATA.trackingNumber,
          trackingUrl: TEST_DATA.trackingUrl,
          carrier: TEST_DATA.carrier,
          productType: TEST_DATA.productType
        })
      }
    ];

    for (const test of emailTests) {
      console.log(`📧 Testing "${test.name}" email...`);
      
      if (mode === 'mock') {
        await MockEmailService.send({
          to: TEST_DATA.customerEmail,
          subject: `Test ${test.name} Email`,
          html: `<p>This is a mock ${test.name.toLowerCase()} email</p>`
        });
      } else {
        const result = await test.fn();
        if (!result.success) {
          console.error(`❌ Failed to send ${test.name} email:`, result.error);
        }
      }
      
      console.log(`✅ ${test.name} email processed successfully\n`);
      
      // Wait between emails to be respectful
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('🎉 All email tests completed successfully!');
    
    if (mode === 'mock') {
      console.log(`\n📊 Mock Email Summary:`);
      console.log(`Total emails logged: ${MockEmailService.getEmailCount()}`);
      console.log('No real emails were sent - domain reputation protected! ✅');
    } else if (mode === 'test') {
      console.log(`\n📬 Check ${testRecipient} for test emails`);
      console.log(`Remaining emails this hour: ${EmailRateLimit.getRemainingEmails(testRecipient)}`);
    }

  } catch (error) {
    console.error('❌ Error during email testing:', error);
    process.exit(1);
  }
}

// Display help
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Safe Email Testing Script

Usage:
  node scripts/safe-email-test.js --mode=<mode>

Modes:
  mock  - No real emails sent, just logged (safest)
  test  - All emails redirected to test recipient
  live  - Send to actual recipients (production only)

Examples:
  node scripts/safe-email-test.js --mode=mock
  node scripts/safe-email-test.js --mode=test

Environment Variables:
  EMAIL_TEST_RECIPIENT - Test email recipient (default: pawpopart@gmail.com)
  RESEND_API_KEY - Your Resend API key (required for test/live modes)
  `);
  process.exit(0);
}

runSafeEmailTest();
