#!/usr/bin/env node

/**
 * Email Testing Script
 * 
 * This script sends test emails to pawpopart@gmail.com to verify email functionality.
 * Make sure to add RESEND_API_KEY to your .env.local file before running.
 * 
 * Usage: node scripts/test-emails.js
 */

require('dotenv').config({ path: '.env.local' });

const { 
  sendMasterpieceCreatingEmail,
  sendMasterpieceReadyEmail,
  sendOrderConfirmationEmail,
  sendShippingNotificationEmail
} = require('../src/lib/email.ts');

const TEST_EMAIL = 'pawpopart@gmail.com';
const TEST_DATA = {
  customerName: 'Test Customer',
  customerEmail: TEST_EMAIL,
  petName: 'Buddy',
  artworkUrl: 'https://pawpopart.com/artwork/test-token-123',
  generatedImageUrl: 'https://example.com/test-artwork.jpg',
  orderNumber: 'TEST-ORDER-123',
  productType: 'Canvas Print',
  productSize: '16x20',
  amount: 4999, // $49.99 in cents
  currency: 'usd',
  trackingNumber: 'TEST123456789',
  trackingUrl: 'https://tracking.example.com/TEST123456789',
  carrier: 'UPS'
};

async function testEmails() {
  console.log('🧪 Testing email functionality...\n');
  
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY not found in environment variables');
    console.log('Please add your Resend API key to .env.local:');
    console.log('RESEND_API_KEY=your_api_key_here\n');
    process.exit(1);
  }

  try {
    // Test 1: Masterpiece Creating Email
    console.log('📧 Sending "Masterpiece Being Created" email...');
    await sendMasterpieceCreatingEmail({
      customerName: TEST_DATA.customerName,
      customerEmail: TEST_DATA.customerEmail,
      petName: TEST_DATA.petName,
      artworkUrl: TEST_DATA.artworkUrl
    });
    console.log('✅ Masterpiece creating email sent successfully\n');

    // Wait 2 seconds between emails
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 2: Masterpiece Ready Email
    console.log('📧 Sending "Masterpiece Ready" email...');
    await sendMasterpieceReadyEmail({
      customerName: TEST_DATA.customerName,
      customerEmail: TEST_DATA.customerEmail,
      petName: TEST_DATA.petName,
      artworkUrl: TEST_DATA.artworkUrl,
      generatedImageUrl: TEST_DATA.generatedImageUrl
    });
    console.log('✅ Masterpiece ready email sent successfully\n');

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 3: Order Confirmation Email
    console.log('📧 Sending "Order Confirmation" email...');
    await sendOrderConfirmationEmail({
      customerName: TEST_DATA.customerName,
      customerEmail: TEST_DATA.customerEmail,
      orderNumber: TEST_DATA.orderNumber,
      productType: TEST_DATA.productType,
      productSize: TEST_DATA.productSize,
      amount: TEST_DATA.amount,
      currency: TEST_DATA.currency,
      petName: TEST_DATA.petName
    });
    console.log('✅ Order confirmation email sent successfully\n');

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 4: Shipping Notification Email
    console.log('📧 Sending "Shipping Notification" email...');
    await sendShippingNotificationEmail({
      customerName: TEST_DATA.customerName,
      customerEmail: TEST_DATA.customerEmail,
      orderNumber: TEST_DATA.orderNumber,
      trackingNumber: TEST_DATA.trackingNumber,
      trackingUrl: TEST_DATA.trackingUrl,
      carrier: TEST_DATA.carrier,
      productType: TEST_DATA.productType
    });
    console.log('✅ Shipping notification email sent successfully\n');

    console.log('🎉 All test emails sent successfully!');
    console.log(`📬 Check ${TEST_EMAIL} for the test emails.`);
    
  } catch (error) {
    console.error('❌ Error sending test emails:', error);
    process.exit(1);
  }
}

// Run the test
testEmails();
