#!/usr/bin/env node

/**
 * Simple test to call Printify order creation directly via API
 */

require('dotenv').config({ path: '.env.local' });

async function testSimplePrintify() {
  console.log('🧪 TESTING SIMPLE PRINTIFY ORDER CREATION VIA API\n');

  const baseUrl = 'http://localhost:3000';
  const testSessionId = 'cs_printify_test_1758954334174'; // From our last test
  const testImageUrl = `${baseUrl}/images/e2e%20testing/test_high_res.png`;

  try {
    console.log('🚀 Calling admin approval API directly...');
    
    // Call the admin approval API which should trigger Printify order creation
    const response = await fetch(`${baseUrl}/api/admin/reviews/25255ceb-8410-46a9-ad6c-0020232841ad/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'approved',
        reviewedBy: 'simple-test-script',
        notes: 'Testing Printify order creation with enhanced logging'
      })
    });

    console.log(`📡 Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API call failed:', errorText);
      return false;
    }

    const result = await response.json();
    console.log('✅ API call successful:', result);
    
    // Wait a moment for processing
    console.log('\n⏳ Waiting 10 seconds for processing...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    return true;

  } catch (error) {
    console.error('💥 Test failed:', error);
    return false;
  }
}

// Run the test
testSimplePrintify()
  .then((success) => {
    console.log(`\n✨ Simple Printify test: ${success ? '✅ SUCCESS' : '❌ FAILURE'}`);
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('💥 Test crashed:', error);
    process.exit(1);
  });
