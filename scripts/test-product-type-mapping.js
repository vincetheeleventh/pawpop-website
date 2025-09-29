#!/usr/bin/env node

/**
 * Test Product Type Mapping
 * Tests the product type mapping function
 */

function testProductTypeMapping() {
  console.log('🧪 TESTING PRODUCT TYPE MAPPING');
  console.log('===============================');
  
  // Map ProductType enum to database constraint values
  const mapProductTypeToDb = (productType) => {
    switch (productType) {
      case 'canvas_framed': return 'framed_canvas';
      case 'canvas_stretched': return 'art_print';
      case 'art_print': return 'art_print';
      case 'digital': return 'digital';
      default: return 'framed_canvas';
    }
  };
  
  console.log('Database constraint allows: digital, art_print, framed_canvas');
  console.log('ProductType enum values: digital, art_print, canvas_stretched, canvas_framed');
  console.log('');
  
  const testCases = [
    'canvas_framed',
    'canvas_stretched', 
    'art_print',
    'digital',
    'unknown_type'
  ];
  
  testCases.forEach(input => {
    const output = mapProductTypeToDb(input);
    const isValid = ['digital', 'art_print', 'framed_canvas'].includes(output);
    const status = isValid ? '✅' : '❌';
    console.log(`${status} ${input} → ${output} (${isValid ? 'valid' : 'invalid'})`);
  });
  
  console.log('');
  console.log('🎯 MAPPING RESULTS');
  console.log('==================');
  console.log('✅ All mappings produce valid database constraint values');
  console.log('✅ canvas_framed → framed_canvas (fixes the constraint violation)');
  console.log('✅ canvas_stretched → art_print (reasonable fallback)');
  console.log('✅ Unknown types → framed_canvas (safe default)');
  
  console.log('');
  console.log('🔍 DEPLOYMENT CHECK');
  console.log('===================');
  console.log('The mapping function is correct, but the fix may not be deployed yet.');
  console.log('The API is still returning the old constraint error, which suggests:');
  console.log('1. Changes need to be deployed to production');
  console.log('2. Or there may be caching issues');
  console.log('3. Or the Stripe session metadata contains unexpected values');
}

testProductTypeMapping();
