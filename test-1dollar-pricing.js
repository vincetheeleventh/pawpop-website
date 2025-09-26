#!/usr/bin/env node

// Test script to verify $1 pricing override is working
const { getProductPricing } = require('./src/lib/printify-products.ts');

console.log('🧪 Testing $1 Pricing Override\n');

// Test different product types and sizes
const testCases = [
  { productType: 'digital', size: 'digital', country: 'US', frameUpgrade: false },
  { productType: 'art_print', size: '12x18', country: 'US', frameUpgrade: false },
  { productType: 'art_print', size: '18x24', country: 'US', frameUpgrade: false },
  { productType: 'art_print', size: '20x30', country: 'US', frameUpgrade: false },
  { productType: 'canvas_stretched', size: '12x18', country: 'US', frameUpgrade: false },
  { productType: 'canvas_stretched', size: '16x24', country: 'US', frameUpgrade: true },
  { productType: 'canvas_framed', size: '20x30', country: 'US', frameUpgrade: false },
];

console.log('Expected: All prices should be 100 cents ($1.00)\n');

testCases.forEach((testCase, index) => {
  try {
    const price = getProductPricing(
      testCase.productType,
      testCase.size,
      testCase.country,
      testCase.frameUpgrade
    );
    
    const status = price === 100 ? '✅ PASS' : '❌ FAIL';
    const dollars = (price / 100).toFixed(2);
    
    console.log(`${index + 1}. ${testCase.productType} ${testCase.size}${testCase.frameUpgrade ? ' +frame' : ''}`);
    console.log(`   Result: ${price} cents ($${dollars}) ${status}`);
    
    if (price !== 100) {
      console.log(`   ⚠️  Expected: 100 cents, Got: ${price} cents`);
    }
    console.log('');
    
  } catch (error) {
    console.log(`${index + 1}. ${testCase.productType} ${testCase.size} - ❌ ERROR`);
    console.log(`   Error: ${error.message}\n`);
  }
});

console.log('🎯 Test Summary:');
console.log('If all tests show "✅ PASS", the $1 override is working correctly.');
console.log('If any show "❌ FAIL", the override may not be applied properly.');
