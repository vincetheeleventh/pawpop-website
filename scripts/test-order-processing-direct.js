#!/usr/bin/env node

/**
 * Test the createPrintifyOrderAfterApproval function directly
 */

require('dotenv').config({ path: '.env.local' });

async function testOrderProcessingDirect() {
  console.log('🔍 TESTING createPrintifyOrderAfterApproval FUNCTION DIRECTLY\n');

  try {
    // Import the function
    const { createPrintifyOrderAfterApproval } = await import('../src/lib/order-processing.js');
    
    const testSessionId = 'cs_printify_test_1758954098312'; // From our last test
    const testImageUrl = 'http://localhost:3000/images/e2e%20testing/test_high_res.png';
    
    console.log(`📦 Testing with session: ${testSessionId}`);
    console.log(`📸 Testing with image: ${testImageUrl}`);
    
    console.log('\n🚀 Calling createPrintifyOrderAfterApproval...');
    
    await createPrintifyOrderAfterApproval(testSessionId, testImageUrl);
    
    console.log('✅ Function completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Function failed:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
    return false;
  }
}

// Run the test
testOrderProcessingDirect()
  .then((success) => {
    console.log(`\n✨ Direct function test: ${success ? '✅ SUCCESS' : '❌ FAILURE'}`);
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('💥 Test crashed:', error);
    process.exit(1);
  });
