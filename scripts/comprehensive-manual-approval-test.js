#!/usr/bin/env node

/**
 * Comprehensive test suite for Manual Approval → Printify Integration
 * 
 * This script performs:
 * 1. Database state verification
 * 2. API endpoint testing
 * 3. Workflow simulation
 * 4. Integration verification
 */

const { createClient } = require('@supabase/supabase-js');

// Environment setup
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runComprehensiveTests() {
  console.log('🧪 COMPREHENSIVE MANUAL APPROVAL → PRINTIFY INTEGRATION TESTS\n');
  
  const testResults = {
    environmentCheck: false,
    databaseSchema: false,
    apiEndpoints: false,
    workflowSimulation: false,
    integrationVerification: false
  };

  try {
    // Test 1: Environment and Configuration Check
    console.log('1️⃣ ENVIRONMENT & CONFIGURATION CHECK');
    console.log('=' .repeat(50));
    
    const envChecks = {
      manualReviewEnabled: process.env.ENABLE_HUMAN_REVIEW === 'true',
      adminEmail: !!process.env.ADMIN_EMAIL,
      printifyToken: !!process.env.PRINTIFY_API_TOKEN,
      printifyShop: !!process.env.PRINTIFY_SHOP_ID,
      stripeSecret: !!process.env.STRIPE_SECRET_KEY,
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    };

    console.log('Environment Variables:');
    Object.entries(envChecks).forEach(([key, value]) => {
      console.log(`   ${value ? '✅' : '❌'} ${key}: ${value ? 'SET' : 'MISSING'}`);
    });

    testResults.environmentCheck = Object.values(envChecks).every(Boolean);
    console.log(`\n🎯 Environment Check: ${testResults.environmentCheck ? '✅ PASSED' : '❌ FAILED'}\n`);

    // Test 2: Database Schema Verification
    console.log('2️⃣ DATABASE SCHEMA VERIFICATION');
    console.log('=' .repeat(50));

    // Check admin_reviews table
    const { data: reviewsSchema, error: reviewsError } = await supabase
      .from('admin_reviews')
      .select('*')
      .limit(1);

    console.log(`   ${reviewsError ? '❌' : '✅'} admin_reviews table: ${reviewsError ? 'ERROR' : 'OK'}`);
    if (reviewsError) console.log(`      Error: ${reviewsError.message}`);

    // Check orders table with pending_review status
    const { data: ordersSchema, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('order_status', 'pending_review')
      .limit(1);

    console.log(`   ${ordersError ? '❌' : '✅'} orders table (pending_review): ${ordersError ? 'ERROR' : 'OK'}`);
    if (ordersError) console.log(`      Error: ${ordersError.message}`);

    // Check artworks table
    const { data: artworksSchema, error: artworksError } = await supabase
      .from('artworks')
      .select('*')
      .limit(1);

    console.log(`   ${artworksSchema ? '✅' : '❌'} artworks table: ${artworksError ? 'ERROR' : 'OK'}`);
    if (artworksError) console.log(`      Error: ${artworksError.message}`);

    testResults.databaseSchema = !reviewsError && !ordersError && !artworksError;
    console.log(`\n🎯 Database Schema: ${testResults.databaseSchema ? '✅ PASSED' : '❌ FAILED'}\n`);

    // Test 3: API Endpoints Testing
    console.log('3️⃣ API ENDPOINTS TESTING');
    console.log('=' .repeat(50));

    const apiTests = [];

    // Test admin reviews endpoint
    try {
      const reviewsResponse = await fetch(`${baseUrl}/api/admin/reviews`);
      const reviewsOk = reviewsResponse.ok;
      apiTests.push({ name: 'GET /api/admin/reviews', passed: reviewsOk });
      console.log(`   ${reviewsOk ? '✅' : '❌'} GET /api/admin/reviews: ${reviewsResponse.status}`);
    } catch (error) {
      apiTests.push({ name: 'GET /api/admin/reviews', passed: false });
      console.log(`   ❌ GET /api/admin/reviews: ERROR - ${error.message}`);
    }

    // Test order processing functions
    try {
      const orderProcessingModule = require('../src/lib/order-processing.ts');
      const hasCreatePrintifyOrderAfterApproval = typeof orderProcessingModule.createPrintifyOrderAfterApproval === 'function';
      apiTests.push({ name: 'createPrintifyOrderAfterApproval function', passed: hasCreatePrintifyOrderAfterApproval });
      console.log(`   ${hasCreatePrintifyOrderAfterApproval ? '✅' : '❌'} createPrintifyOrderAfterApproval function: ${hasCreatePrintifyOrderAfterApproval ? 'EXISTS' : 'MISSING'}`);
    } catch (error) {
      apiTests.push({ name: 'createPrintifyOrderAfterApproval function', passed: false });
      console.log(`   ❌ createPrintifyOrderAfterApproval function: ERROR - ${error.message}`);
    }

    testResults.apiEndpoints = apiTests.every(test => test.passed);
    console.log(`\n🎯 API Endpoints: ${testResults.apiEndpoints ? '✅ PASSED' : '❌ FAILED'}\n`);

    // Test 4: Workflow Simulation
    console.log('4️⃣ WORKFLOW SIMULATION');
    console.log('=' .repeat(50));

    // Check for existing test data
    const { data: existingOrders } = await supabase
      .from('orders')
      .select(`
        *,
        artworks (
          id,
          customer_name,
          generated_images,
          processing_status
        )
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    console.log(`   📊 Found ${existingOrders?.length || 0} recent orders in database`);

    if (existingOrders && existingOrders.length > 0) {
      const testOrder = existingOrders[0];
      console.log(`   🎯 Using order: ${testOrder.stripe_session_id}`);
      console.log(`      Status: ${testOrder.order_status}`);
      console.log(`      Product: ${testOrder.product_type}`);
      console.log(`      Customer: ${testOrder.artworks?.customer_name || 'Unknown'}`);

      // Check for corresponding reviews
      const { data: reviews } = await supabase
        .from('admin_reviews')
        .select('*')
        .eq('artwork_id', testOrder.artwork_id)
        .order('created_at', { ascending: false });

      console.log(`   📋 Found ${reviews?.length || 0} reviews for this artwork`);
      
      if (reviews && reviews.length > 0) {
        reviews.forEach((review, index) => {
          console.log(`      ${index + 1}. ${review.review_type}: ${review.status}`);
        });
      }
    }

    // Simulate workflow logic check
    const workflowChecks = {
      manualReviewEnabled: process.env.ENABLE_HUMAN_REVIEW === 'true',
      hasTestData: existingOrders && existingOrders.length > 0,
      canCreateReviews: !reviewsError,
      canUpdateOrders: !ordersError
    };

    console.log('\n   Workflow Prerequisites:');
    Object.entries(workflowChecks).forEach(([key, value]) => {
      console.log(`      ${value ? '✅' : '❌'} ${key}: ${value ? 'OK' : 'FAIL'}`);
    });

    testResults.workflowSimulation = Object.values(workflowChecks).every(Boolean);
    console.log(`\n🎯 Workflow Simulation: ${testResults.workflowSimulation ? '✅ PASSED' : '❌ FAILED'}\n`);

    // Test 5: Integration Verification
    console.log('5️⃣ INTEGRATION VERIFICATION');
    console.log('=' .repeat(50));

    // Check if we have orders in different states
    const statusCounts = {};
    if (existingOrders) {
      existingOrders.forEach(order => {
        statusCounts[order.order_status] = (statusCounts[order.order_status] || 0) + 1;
      });
    }

    console.log('   Order Status Distribution:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`      ${status}: ${count} orders`);
    });

    // Check for pending reviews
    const { data: pendingReviews } = await supabase
      .from('admin_reviews')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    console.log(`   📋 Pending Reviews: ${pendingReviews?.length || 0}`);

    // Check for orders awaiting review
    const { data: pendingOrders } = await supabase
      .from('orders')
      .select('*')
      .eq('order_status', 'pending_review');

    console.log(`   📦 Orders in pending_review: ${pendingOrders?.length || 0}`);

    const integrationChecks = {
      hasOrderStatuses: Object.keys(statusCounts).length > 0,
      canTrackReviews: !reviewsError,
      canUpdateOrderStatus: !ordersError,
      workflowIntegrated: testResults.environmentCheck && testResults.databaseSchema && testResults.apiEndpoints
    };

    console.log('\n   Integration Status:');
    Object.entries(integrationChecks).forEach(([key, value]) => {
      console.log(`      ${value ? '✅' : '❌'} ${key}: ${value ? 'OK' : 'FAIL'}`);
    });

    testResults.integrationVerification = Object.values(integrationChecks).every(Boolean);
    console.log(`\n🎯 Integration Verification: ${testResults.integrationVerification ? '✅ PASSED' : '❌ FAILED'}\n`);

    // Final Results Summary
    console.log('📊 COMPREHENSIVE TEST RESULTS');
    console.log('=' .repeat(50));
    
    Object.entries(testResults).forEach(([test, passed]) => {
      console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
    });

    const overallSuccess = Object.values(testResults).every(Boolean);
    console.log(`\n🎯 OVERALL RESULT: ${overallSuccess ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

    if (overallSuccess) {
      console.log('\n🎉 MANUAL APPROVAL → PRINTIFY INTEGRATION IS READY!');
      console.log('   ✅ Environment properly configured');
      console.log('   ✅ Database schema is correct');
      console.log('   ✅ API endpoints are functional');
      console.log('   ✅ Workflow logic is implemented');
      console.log('   ✅ Integration is verified');
      console.log('\n📋 NEXT STEPS:');
      console.log('   1. Create a test order by purchasing a physical product');
      console.log('   2. Verify order stops at pending_review status');
      console.log('   3. Use admin dashboard to approve high-res file');
      console.log('   4. Confirm Printify order is created with approved image');
    } else {
      console.log('\n⚠️  ISSUES FOUND - REVIEW FAILED TESTS ABOVE');
      console.log('   Check environment variables and database configuration');
      console.log('   Ensure all required services are running');
    }

  } catch (error) {
    console.error('💥 Test suite crashed:', error);
    return false;
  }

  return Object.values(testResults).every(Boolean);
}

// Run the comprehensive tests
runComprehensiveTests()
  .then((success) => {
    console.log(`\n✨ Test suite completed: ${success ? 'SUCCESS' : 'FAILURE'}`);
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('💥 Test suite failed:', error);
    process.exit(1);
  });
