#!/usr/bin/env node

// Test script to send design system email to pawpopart@gmail.com
require('dotenv').config({ path: '.env.local' });

async function sendTestEmail() {
  console.log('📧 Sending test email with new design system...');
  
  // Import the email function
  const { sendMasterpieceReadyEmail } = require('../src/lib/email.ts');
  
  const testData = {
    customerName: 'Design System Test',
    customerEmail: 'pawpopart@gmail.com',
    petName: 'Buddy',
    artworkUrl: 'https://pawpopart.com/artwork/design-system-test-123',
    generatedImageUrl: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=400&fit=crop'
  };

  try {
    console.log('🎨 Test email data:');
    console.log(`- Customer: ${testData.customerName}`);
    console.log(`- Pet: ${testData.petName}`);
    console.log(`- Recipient: ${testData.customerEmail}`);
    console.log(`- Artwork URL: ${testData.artworkUrl}`);
    
    const result = await sendMasterpieceReadyEmail(testData);
    
    if (result.success) {
      console.log('✅ Test email sent successfully!');
      console.log('📧 Message ID:', result.messageId);
      console.log('');
      console.log('🎯 Check pawpopart@gmail.com for the email with:');
      console.log('   ✨ New Design System Colors:');
      console.log('      - Cyclamen header (#FF70A6)');
      console.log('      - Atomic Tangerine CTA button (#FF9770)');
      console.log('      - Cream background (#F5EED7)');
      console.log('      - Naples Yellow dividers (#FFD670)');
      console.log('   📝 New Typography:');
      console.log('      - Arvo font for headers');
      console.log('      - Geist font for body text');
      console.log('      - Fredoka One font for CTA button');
      console.log('   🎨 Design System Features:');
      console.log('      - 12px border radius');
      console.log('      - Professional shadows');
      console.log('      - Naples Yellow image border');
      console.log('      - Consistent spacing and hierarchy');
    } else {
      console.error('❌ Email failed to send:', result.error);
      console.log('');
      console.log('🔧 Troubleshooting:');
      console.log('   - Check RESEND_API_KEY in .env.local');
      console.log('   - Verify email service configuration');
      console.log('   - Check network connectivity');
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('');
    console.log('🔧 Common issues:');
    console.log('   - Missing .env.local file');
    console.log('   - RESEND_API_KEY not configured');
    console.log('   - Email service not accessible');
  }
}

// Run the test
console.log('🚀 Starting design system email test...');
console.log('=====================================');
sendTestEmail();
