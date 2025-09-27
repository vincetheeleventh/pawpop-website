#!/usr/bin/env node

/**
 * Direct API endpoint testing for manual approval workflow
 */

require('dotenv').config({ path: '.env.local' });

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

async function testApiEndpoints() {
  console.log('🧪 TESTING API ENDPOINTS FOR MANUAL APPROVAL WORKFLOW\n');

  const tests = [];

  // Test 1: Admin Reviews API
  console.log('1️⃣ Testing Admin Reviews API...');
  try {
    const response = await fetch(`${baseUrl}/api/admin/reviews`);
    const data = await response.json();
    
    tests.push({
      name: 'GET /api/admin/reviews',
      passed: response.ok,
      status: response.status,
      data: data
    });
    
    console.log(`   ${response.ok ? '✅' : '❌'} Status: ${response.status}`);
    if (response.ok && data.reviews) {
      console.log(`   📊 Found ${data.reviews.length} reviews`);
      if (data.reviews.length > 0) {
        console.log(`   📋 Sample review types: ${[...new Set(data.reviews.map(r => r.review_type))].join(', ')}`);
      }
    }
  } catch (error) {
    tests.push({
      name: 'GET /api/admin/reviews',
      passed: false,
      error: error.message
    });
    console.log(`   ❌ Error: ${error.message}`);
  }

  // Test 2: Monitoring Dashboard (includes system health)
  console.log('\n2️⃣ Testing System Health...');
  try {
    const response = await fetch(`${baseUrl}/api/monitoring/dashboard`);
    const data = await response.json();
    
    tests.push({
      name: 'GET /api/monitoring/dashboard',
      passed: response.ok,
      status: response.status,
      data: data
    });
    
    console.log(`   ${response.ok ? '✅' : '❌'} Status: ${response.status}`);
    if (response.ok && data.systemHealth) {
      console.log(`   🏥 System Health: ${data.systemHealth.status}`);
      console.log(`   📊 Services: Supabase=${data.systemHealth.services.supabase}, FAL=${data.systemHealth.services.fal}, Stripe=${data.systemHealth.services.stripe}`);
    }
  } catch (error) {
    tests.push({
      name: 'GET /api/monitoring/dashboard',
      passed: false,
      error: error.message
    });
    console.log(`   ❌ Error: ${error.message}`);
  }

  // Test 3: Check if server is running and can handle requests
  console.log('\n3️⃣ Testing Server Availability...');
  try {
    const response = await fetch(`${baseUrl}/api/test/env-check`);
    const data = await response.json();
    
    tests.push({
      name: 'GET /api/test/env-check',
      passed: response.ok,
      status: response.status,
      data: data
    });
    
    console.log(`   ${response.ok ? '✅' : '❌'} Status: ${response.status}`);
    if (response.ok) {
      console.log(`   🔧 Environment: ${data.environment || 'Unknown'}`);
      console.log(`   🔑 Required vars: ${data.hasRequiredVars ? 'Present' : 'Missing'}`);
    }
  } catch (error) {
    tests.push({
      name: 'GET /api/test/env-check',
      passed: false,
      error: error.message
    });
    console.log(`   ❌ Error: ${error.message}`);
  }

  // Summary
  console.log('\n📊 TEST RESULTS SUMMARY');
  console.log('=' .repeat(50));
  
  const passedTests = tests.filter(t => t.passed).length;
  const totalTests = tests.length;
  
  tests.forEach(test => {
    console.log(`${test.passed ? '✅' : '❌'} ${test.name}: ${test.passed ? 'PASSED' : 'FAILED'}`);
    if (!test.passed && test.error) {
      console.log(`   Error: ${test.error}`);
    }
  });

  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All API endpoints are functional!');
    return true;
  } else {
    console.log('⚠️  Some API endpoints have issues');
    return false;
  }
}

// Run the tests
testApiEndpoints()
  .then((success) => {
    console.log(`\n✨ API testing completed: ${success ? 'SUCCESS' : 'FAILURE'}`);
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('💥 API testing failed:', error);
    process.exit(1);
  });
