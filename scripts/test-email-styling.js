#!/usr/bin/env node

// Test script to verify email styling fixes
const { sendMasterpieceReadyEmail } = require('../src/lib/email.ts');

async function testEmailStyling() {
  console.log('🧪 Testing email styling fixes...');
  
  const testData = {
    customerName: 'Test Customer',
    customerEmail: 'pawpopart@gmail.com', // Test recipient
    petName: 'Buddy',
    artworkUrl: 'https://pawpopart.com/artwork/test-token-123',
    generatedImageUrl: 'https://example.com/test-image.jpg'
  };

  try {
    const result = await sendMasterpieceReadyEmail(testData);
    
    if (result.success) {
      console.log('✅ Email sent successfully!');
      console.log('📧 Message ID:', result.messageId);
      console.log('🎯 Check pawpopart@gmail.com for the test email');
      console.log('🔍 Verify that:');
      console.log('   - CTA button has blue background');
      console.log('   - Button text is white and visible');
      console.log('   - All text elements are properly visible');
    } else {
      console.error('❌ Email failed to send:', result.error);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testEmailStyling();
