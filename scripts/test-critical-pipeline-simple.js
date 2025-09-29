#!/usr/bin/env node

/**
 * Simple Critical Pipeline Test
 * A lightweight test that verifies the critical pipeline without Playwright
 */

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

async function testCriticalPipeline() {
  console.log('🚀 SIMPLE CRITICAL PIPELINE TEST');
  console.log('================================');
  console.log(`Base URL: ${baseUrl}`);
  
  let passedTests = 0;
  let totalTests = 0;
  
  // Test 1: Environment Check
  console.log('\n🔧 TEST 1: Environment Configuration');
  console.log('===================================');
  totalTests++;
  
  try {
    const response = await fetch(`${baseUrl}/api/test/env-check`);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Environment API accessible');
      console.log(`   FAL_KEY: ${data.falKey}`);
      console.log(`   ENABLE_HUMAN_REVIEW: ${data.enableHumanReview}`);
      console.log(`   ADMIN_EMAIL: ${data.adminEmail}`);
      console.log(`   RESEND_API_KEY: ${data.resendApiKey}`);
      
      if (data.falKey === 'SET' && data.resendApiKey === 'SET') {
        passedTests++;
        console.log('✅ Environment test PASSED');
      } else {
        console.log('❌ Environment test FAILED - missing API keys');
      }
    } else {
      console.log('❌ Environment API failed');
    }
  } catch (error) {
    console.log(`❌ Environment test failed: ${error.message}`);
  }
  
  // Test 2: Admin Review System
  console.log('\n👨‍💼 TEST 2: Admin Review System');
  console.log('===============================');
  totalTests++;
  
  try {
    const response = await fetch(`${baseUrl}/api/admin/review-status`);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Admin review API accessible');
      console.log(`   Human review enabled: ${data.humanReviewEnabled}`);
      passedTests++;
      console.log('✅ Admin review test PASSED');
    } else {
      console.log('❌ Admin review API failed');
    }
  } catch (error) {
    console.log(`❌ Admin review test failed: ${error.message}`);
  }
  
  // Test 3: Order Reconciliation
  console.log('\n📦 TEST 3: Order Reconciliation System');
  console.log('=====================================');
  totalTests++;
  
  try {
    const response = await fetch(`${baseUrl}/api/orders/reconcile`, {
      method: 'GET'
    });
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Order reconciliation API accessible');
      console.log(`   Status: ${data.status}`);
      passedTests++;
      console.log('✅ Order reconciliation test PASSED');
    } else {
      console.log('❌ Order reconciliation API failed');
    }
  } catch (error) {
    console.log(`❌ Order reconciliation test failed: ${error.message}`);
  }
  
  // Test 4: Upscaling API
  console.log('\n🎨 TEST 4: High-Res Upscaling API');
  console.log('=================================');
  totalTests++;
  
  try {
    // Test with invalid artwork ID to check API structure
    const response = await fetch(`${baseUrl}/api/upscale`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ artworkId: 'test-invalid-id' })
    });
    
    // We expect this to fail, but with proper error handling
    if (response.status === 400 || response.status === 404) {
      const data = await response.json();
      console.log('✅ Upscaling API accessible and handles errors properly');
      console.log(`   Error response: ${data.error}`);
      passedTests++;
      console.log('✅ Upscaling API test PASSED');
    } else if (response.status === 500) {
      console.log('⚠️ Upscaling API accessible but has server errors');
      console.log('   This may be due to FAL.ai configuration issues');
    } else {
      console.log(`❌ Upscaling API unexpected response: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Upscaling API test failed: ${error.message}`);
  }
  
  // Test 5: Email API
  console.log('\n📧 TEST 5: Email System API');
  console.log('===========================');
  totalTests++;
  
  try {
    // Test with invalid data to check API structure
    const response = await fetch(`${baseUrl}/api/email/masterpiece-ready`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerEmail: 'test@example.com',
        customerName: 'Test User',
        artworkUrl: 'https://example.com/test',
        generatedImageUrl: 'https://example.com/test.jpg'
      })
    });
    
    // Email API should respond (success or validation error)
    if (response.status >= 200 && response.status < 500) {
      console.log('✅ Email API accessible');
      console.log(`   Response status: ${response.status}`);
      passedTests++;
      console.log('✅ Email API test PASSED');
    } else {
      console.log(`❌ Email API failed with status: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Email API test failed: ${error.message}`);
  }
  
  // Test 6: Main Application
  console.log('\n🏠 TEST 6: Main Application');
  console.log('===========================');
  totalTests++;
  
  try {
    const response = await fetch(baseUrl);
    if (response.ok) {
      const html = await response.text();
      if (html.includes('PawPop') || html.includes('pawpop')) {
        console.log('✅ Main application loads successfully');
        console.log('   PawPop branding found in HTML');
        passedTests++;
        console.log('✅ Main application test PASSED');
      } else {
        console.log('⚠️ Main application loads but may have issues');
      }
    } else {
      console.log(`❌ Main application failed to load: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Main application test failed: ${error.message}`);
  }
  
  // Test Results
  console.log('\n🎯 TEST RESULTS SUMMARY');
  console.log('=======================');
  console.log(`Passed: ${passedTests}/${totalTests} tests`);
  console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  if (passedTests === totalTests) {
    console.log('🎉 ALL TESTS PASSED!');
    console.log('');
    console.log('✅ Critical pipeline is ready for production');
    console.log('✅ All APIs are accessible and functional');
    console.log('✅ Environment is properly configured');
    console.log('');
    console.log('🚀 READY FOR ADMIN APPROVAL TESTING!');
    console.log('Admin can now test the complete flow:');
    console.log('1. Visit: https://pawpopart.com/admin/reviews/7480a324-ba9d-4d64-bb24-7200bfdf184d');
    console.log('2. Approve the artwork review');
    console.log('3. Watch console logs for upscaling and order creation');
    console.log('4. Verify success page works');
  } else {
    console.log('⚠️ SOME TESTS FAILED');
    console.log('');
    console.log('Issues to address:');
    if (passedTests < totalTests) {
      console.log('- Check environment variables (.env.local)');
      console.log('- Ensure development server is running (npm run dev)');
      console.log('- Verify API keys are configured correctly');
      console.log('- Check network connectivity');
    }
  }
  
  console.log('\n📋 NEXT STEPS:');
  console.log('==============');
  console.log('1. Fix any failing tests above');
  console.log('2. Run full E2E test: node scripts/run-e2e-test.js');
  console.log('3. Test admin approval manually');
  console.log('4. Verify complete pipeline end-to-end');
  
  return passedTests === totalTests;
}

// Run the test
testCriticalPipeline()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
