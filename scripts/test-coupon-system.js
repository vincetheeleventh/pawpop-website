#!/usr/bin/env node

/**
 * End-to-End Coupon System Test
 * 
 * Tests the complete coupon functionality including:
 * - Database schema and functions
 * - API endpoint validation
 * - Coupon code validation
 * - Pricing calculations
 * - Test coupon functionality
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   - SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Test data
const TEST_COUPONS = [
  {
    code: 'TEST99',
    expectedDiscount: 99,
    expectedType: 'percentage',
    orderAmount: 29.00,
    expectedFinalAmount: 1.00
  },
  {
    code: 'DOLLAR1',
    expectedDiscount: 28.00,
    expectedType: 'fixed_amount',
    orderAmount: 29.00,
    expectedFinalAmount: 1.00
  },
  {
    code: 'SAVE44',
    expectedDiscount: 44.00,
    expectedType: 'fixed_amount',
    orderAmount: 79.00,
    expectedFinalAmount: 35.00
  },
  {
    code: 'WELCOME10',
    expectedDiscount: 10,
    expectedType: 'percentage',
    orderAmount: 29.00,
    expectedFinalAmount: 26.10
  }
];

async function testDatabaseSchema() {
  console.log('\n🔍 Testing Database Schema...');
  
  try {
    // Test coupon_codes table exists
    const { data: coupons, error: couponsError } = await supabase
      .from('coupon_codes')
      .select('*')
      .limit(1);
    
    if (couponsError) {
      throw new Error(`coupon_codes table error: ${couponsError.message}`);
    }
    
    // Test coupon_usage table exists
    const { data: usage, error: usageError } = await supabase
      .from('coupon_usage')
      .select('*')
      .limit(1);
    
    if (usageError) {
      throw new Error(`coupon_usage table error: ${usageError.message}`);
    }
    
    console.log('✅ Database schema verified');
    return true;
  } catch (error) {
    console.error('❌ Database schema test failed:', error.message);
    return false;
  }
}

async function testDatabaseFunctions() {
  console.log('\n🔍 Testing Database Functions...');
  
  try {
    // Test validate_coupon_code function
    const { data: validation, error: validationError } = await supabase.rpc('validate_coupon_code', {
      p_code: 'TEST99',
      p_order_amount: 29.00,
      p_product_type: 'art_print'
    });
    
    if (validationError) {
      throw new Error(`validate_coupon_code error: ${validationError.message}`);
    }
    
    if (!validation || validation.length === 0) {
      throw new Error('validate_coupon_code returned no results');
    }
    
    const result = validation[0];
    if (!result.is_valid) {
      throw new Error(`TEST99 coupon should be valid but got: ${result.error_message}`);
    }
    
    console.log('✅ validate_coupon_code function working');
    console.log(`   - Discount: ${result.discount_value}% off`);
    console.log(`   - Final amount: $${result.final_amount}`);
    
    return true;
  } catch (error) {
    console.error('❌ Database functions test failed:', error.message);
    return false;
  }
}

async function testAPIEndpoint() {
  console.log('\n🔍 Testing API Endpoint...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/coupons/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: 'TEST99',
        orderAmount: 29.00,
        productType: 'art_print'
      })
    });
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.isValid) {
      throw new Error(`API validation failed: ${data.errorMessage}`);
    }
    
    console.log('✅ API endpoint working');
    console.log(`   - Coupon ID: ${data.couponId}`);
    console.log(`   - Discount: ${data.discountValue}% off`);
    console.log(`   - Savings: $${data.savings}`);
    console.log(`   - Final amount: $${data.finalAmount}`);
    
    return true;
  } catch (error) {
    console.error('❌ API endpoint test failed:', error.message);
    return false;
  }
}

async function testAllCoupons() {
  console.log('\n🔍 Testing All Test Coupons...');
  
  let allPassed = true;
  
  for (const testCoupon of TEST_COUPONS) {
    try {
      console.log(`\n   Testing ${testCoupon.code}...`);
      
      const { data: validation, error } = await supabase.rpc('validate_coupon_code', {
        p_code: testCoupon.code,
        p_order_amount: testCoupon.orderAmount,
        p_product_type: 'art_print'
      });
      
      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }
      
      if (!validation || validation.length === 0) {
        throw new Error('No validation result returned');
      }
      
      const result = validation[0];
      
      if (!result.is_valid) {
        throw new Error(`Coupon should be valid: ${result.error_message}`);
      }
      
      // Verify discount type
      if (result.discount_type !== testCoupon.expectedType) {
        throw new Error(`Expected ${testCoupon.expectedType}, got ${result.discount_type}`);
      }
      
      // Verify discount value
      if (Math.abs(result.discount_value - testCoupon.expectedDiscount) > 0.01) {
        throw new Error(`Expected discount ${testCoupon.expectedDiscount}, got ${result.discount_value}`);
      }
      
      // Verify final amount (with tolerance for rounding)
      if (Math.abs(result.final_amount - testCoupon.expectedFinalAmount) > 0.10) {
        throw new Error(`Expected final amount ${testCoupon.expectedFinalAmount}, got ${result.final_amount}`);
      }
      
      console.log(`   ✅ ${testCoupon.code}: ${result.discount_value}${testCoupon.expectedType === 'percentage' ? '%' : '$'} off → $${result.final_amount}`);
      
    } catch (error) {
      console.error(`   ❌ ${testCoupon.code}: ${error.message}`);
      allPassed = false;
    }
  }
  
  return allPassed;
}

async function testInvalidCoupons() {
  console.log('\n🔍 Testing Invalid Coupons...');
  
  const invalidCoupons = [
    { code: 'INVALID123', expectedError: 'Invalid coupon code' },
    { code: 'EXPIRED', expectedError: 'Invalid coupon code' },
    { code: '', expectedError: 'Invalid coupon code' }
  ];
  
  let allPassed = true;
  
  for (const testCase of invalidCoupons) {
    try {
      console.log(`   Testing invalid coupon: "${testCase.code}"...`);
      
      const { data: validation, error } = await supabase.rpc('validate_coupon_code', {
        p_code: testCase.code,
        p_order_amount: 29.00,
        p_product_type: 'art_print'
      });
      
      if (error) {
        // Database errors are expected for some invalid inputs
        console.log(`   ✅ Database properly rejected: ${testCase.code}`);
        continue;
      }
      
      if (!validation || validation.length === 0) {
        console.log(`   ✅ No results for invalid coupon: ${testCase.code}`);
        continue;
      }
      
      const result = validation[0];
      
      if (result.is_valid) {
        throw new Error(`Invalid coupon "${testCase.code}" was marked as valid`);
      }
      
      console.log(`   ✅ Properly rejected: ${testCase.code} - ${result.error_message}`);
      
    } catch (error) {
      console.error(`   ❌ Invalid coupon test failed for "${testCase.code}": ${error.message}`);
      allPassed = false;
    }
  }
  
  return allPassed;
}

async function testCouponUsageTracking() {
  console.log('\n🔍 Testing Coupon Usage Tracking...');
  
  try {
    // Get a test coupon ID
    const { data: coupons, error: couponError } = await supabase
      .from('coupon_codes')
      .select('id')
      .eq('code', 'TEST99')
      .single();
    
    if (couponError || !coupons) {
      throw new Error('Could not find TEST99 coupon for usage test');
    }
    
    // Test the apply_coupon_code function
    const testOrderId = `test_order_${Date.now()}`;
    const testArtworkId = '00000000-0000-0000-0000-000000000000'; // UUID format
    
    const { data: applyResult, error: applyError } = await supabase.rpc('apply_coupon_code', {
      p_coupon_id: coupons.id,
      p_order_id: testOrderId,
      p_artwork_id: testArtworkId,
      p_original_amount: 29.00,
      p_discount_amount: 28.71,
      p_final_amount: 1.00,
      p_user_email: 'test@example.com',
      p_ip_address: '192.168.1.1',
      p_user_agent: 'Test User Agent'
    });
    
    if (applyError) {
      throw new Error(`apply_coupon_code error: ${applyError.message}`);
    }
    
    if (!applyResult) {
      throw new Error('apply_coupon_code returned false');
    }
    
    // Verify the usage was recorded
    const { data: usage, error: usageError } = await supabase
      .from('coupon_usage')
      .select('*')
      .eq('order_id', testOrderId)
      .single();
    
    if (usageError || !usage) {
      throw new Error('Coupon usage was not recorded properly');
    }
    
    console.log('✅ Coupon usage tracking working');
    console.log(`   - Order ID: ${usage.order_id}`);
    console.log(`   - Original: $${usage.original_amount}`);
    console.log(`   - Discount: $${usage.discount_amount}`);
    console.log(`   - Final: $${usage.final_amount}`);
    
    // Clean up test data
    await supabase
      .from('coupon_usage')
      .delete()
      .eq('order_id', testOrderId);
    
    return true;
  } catch (error) {
    console.error('❌ Coupon usage tracking test failed:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🧪 PawPop Coupon System End-to-End Test');
  console.log('==========================================');
  
  const results = {
    schema: await testDatabaseSchema(),
    functions: await testDatabaseFunctions(),
    api: await testAPIEndpoint(),
    coupons: await testAllCoupons(),
    invalid: await testInvalidCoupons(),
    usage: await testCouponUsageTracking()
  };
  
  console.log('\n📊 Test Results Summary');
  console.log('======================');
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  Object.entries(results).forEach(([test, result]) => {
    console.log(`${result ? '✅' : '❌'} ${test.charAt(0).toUpperCase() + test.slice(1)} Test`);
  });
  
  console.log(`\n🎯 Overall Result: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All coupon system tests passed! System is ready for production.');
    
    console.log('\n💡 Test Coupons Available:');
    console.log('   - TEST99: 99% off (for $1 Stripe testing)');
    console.log('   - DOLLAR1: Fixed $28 off (alternative $1 testing)');
    console.log('   - SAVE44: Fixed $44 off (for larger discount testing)');
    console.log('   - WELCOME10: 10% off (production example)');
    
    console.log('\n🚀 Next Steps:');
    console.log('   1. Test in ProductPurchaseModal UI');
    console.log('   2. Verify Stripe checkout integration');
    console.log('   3. Test webhook coupon processing');
    console.log('   4. Monitor Plausible Analytics events');
    
    process.exit(0);
  } else {
    console.log('❌ Some tests failed. Please check the errors above.');
    process.exit(1);
  }
}

// Run the tests
runAllTests().catch(error => {
  console.error('💥 Test runner crashed:', error);
  process.exit(1);
});
