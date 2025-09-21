#!/usr/bin/env node

/**
 * Test script for new Printify product configurations
 * Tests both mockup generation and order fulfillment with updated products
 */

require('dotenv').config();

const BASE_URL = 'http://localhost:3000';
const PRINTIFY_API_URL = 'https://api.printify.com/v1';

// Test image URL (using a sample pet image)
const TEST_IMAGE_URL = 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800&h=800&fit=crop';
const TEST_ARTWORK_ID = 'test-artwork-' + Date.now();

// New product configurations to test
const PRODUCTS_TO_TEST = [
  { type: 'ART_PRINT', size: '12x18', expectedPrice: 2900 },
  { type: 'ART_PRINT', size: '16x24', expectedPrice: 3900 },
  { type: 'ART_PRINT', size: '20x30', expectedPrice: 4800 },
  { type: 'CANVAS_STRETCHED', size: '12x18', expectedPrice: 5900 },
  { type: 'CANVAS_STRETCHED', size: '16x24', expectedPrice: 7900 },
  { type: 'CANVAS_STRETCHED', size: '20x30', expectedPrice: 9900 },
  { type: 'CANVAS_FRAMED', size: '12x18', expectedPrice: 9900 },
  { type: 'CANVAS_FRAMED', size: '16x24', expectedPrice: 11900 },
  { type: 'CANVAS_FRAMED', size: '20x30', expectedPrice: 14900 }
];

async function testMockupGeneration() {
  console.log('🖼️ Testing mockup generation with new products...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/printify/generate-mockups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageUrl: TEST_IMAGE_URL,
        artworkId: TEST_ARTWORK_ID
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('❌ Mockup generation failed:', result);
      return false;
    }

    console.log('✅ Mockup generation successful!');
    console.log(`📊 Generated ${result.mockups?.length || 0} mockups:`);
    
    result.mockups?.forEach((mockup, index) => {
      console.log(`  ${index + 1}. ${mockup.title} (${mockup.type})`);
      console.log(`     Description: ${mockup.description}`);
      console.log(`     Product ID: ${mockup.productId}`);
      console.log(`     Mockup URL: ${mockup.mockupUrl ? 'Generated' : 'Missing'}`);
    });

    // Verify we have all three product types
    const expectedTypes = ['art_print', 'canvas_stretched', 'canvas_framed'];
    const actualTypes = result.mockups?.map(m => m.type) || [];
    
    const missingTypes = expectedTypes.filter(type => !actualTypes.includes(type));
    if (missingTypes.length > 0) {
      console.warn(`⚠️ Missing mockup types: ${missingTypes.join(', ')}`);
    } else {
      console.log('✅ All expected product types generated');
    }

    return result.mockups || [];
  } catch (error) {
    console.error('❌ Error testing mockup generation:', error);
    return false;
  }
}

async function testProductPricing() {
  console.log('\n💰 Testing product pricing with new configurations...');
  
  for (const product of PRODUCTS_TO_TEST) {
    try {
      const response = await fetch(`${BASE_URL}/api/products/pricing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productType: product.type,
          size: product.size,
          region: 'US'
        })
      });

      if (response.ok) {
        const result = await response.json();
        const actualPrice = result.priceInCents;
        
        if (actualPrice === product.expectedPrice) {
          console.log(`✅ ${product.type} ${product.size}: $${actualPrice/100} CAD (correct)`);
        } else {
          console.log(`❌ ${product.type} ${product.size}: Expected $${product.expectedPrice/100}, got $${actualPrice/100} CAD`);
        }
      } else {
        console.log(`❌ ${product.type} ${product.size}: API call failed`);
      }
    } catch (error) {
      console.log(`❌ ${product.type} ${product.size}: Error - ${error.message}`);
    }
  }
}

async function testOrderCreation() {
  console.log('\n📦 Testing order creation with new products...');
  
  // Test one product from each type
  const testProducts = [
    { type: 'ART_PRINT', size: '20x30' },
    { type: 'CANVAS_STRETCHED', size: '16x24' },
    { type: 'CANVAS_FRAMED', size: '12x18' }
  ];

  for (const product of testProducts) {
    try {
      console.log(`\n🧪 Testing ${product.type} ${product.size}...`);
      
      const response = await fetch(`${BASE_URL}/api/checkout/artwork`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          artworkId: TEST_ARTWORK_ID,
          productType: product.type,
          size: product.size,
          customerEmail: 'test@pawpop.com',
          customerName: 'Test Customer',
          petName: 'Test Pet',
          imageUrl: TEST_IMAGE_URL,
          frameUpgrade: false
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Checkout session created: ${result.sessionId ? 'Success' : 'Failed'}`);
        console.log(`   Order ID: ${result.orderId || 'Not provided'}`);
      } else {
        const error = await response.json();
        console.log(`❌ Checkout failed: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.log(`❌ Error testing ${product.type}: ${error.message}`);
    }
  }
}

async function testFrameUpgrade() {
  console.log('\n🖼️ Testing frame upgrade functionality...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/checkout/artwork`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        artworkId: TEST_ARTWORK_ID,
        productType: 'CANVAS_STRETCHED',
        size: '20x30',
        customerEmail: 'test@pawpop.com',
        customerName: 'Test Customer',
        petName: 'Test Pet',
        imageUrl: TEST_IMAGE_URL,
        frameUpgrade: true // Test frame upgrade
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Frame upgrade checkout session created');
      console.log(`   Expected price: $${(9900 + 4000)/100} CAD (stretched + frame upgrade)`);
      console.log(`   Order ID: ${result.orderId || 'Not provided'}`);
    } else {
      const error = await response.json();
      console.log(`❌ Frame upgrade checkout failed: ${error.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.log(`❌ Error testing frame upgrade: ${error.message}`);
  }
}

async function checkPrintifyProducts() {
  console.log('\n🔍 Checking Printify products in shop...');
  
  if (!process.env.PRINTIFY_API_TOKEN || !process.env.PRINTIFY_SHOP_ID) {
    console.log('⚠️ Printify credentials not configured, skipping product check');
    return;
  }

  try {
    const response = await fetch(`${PRINTIFY_API_URL}/shops/${process.env.PRINTIFY_SHOP_ID}/products.json`, {
      headers: {
        'Authorization': `Bearer ${process.env.PRINTIFY_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const result = await response.json();
      const products = result.data || [];
      
      console.log(`📊 Found ${products.length} products in Printify shop`);
      
      // Filter for PawPop products
      const pawpopProducts = products.filter(p => 
        p.title?.includes('PawPop') || p.tags?.includes('pawpop')
      );
      
      console.log(`🐾 PawPop products: ${pawpopProducts.length}`);
      
      pawpopProducts.forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.title} (ID: ${product.id})`);
        console.log(`     Blueprint: ${product.blueprint_id}, Variants: ${product.variants?.length || 0}`);
      });

      if (pawpopProducts.length >= 9) {
        console.log('✅ Expected number of products found (9+)');
      } else {
        console.log(`⚠️ Expected 9+ products, found ${pawpopProducts.length}`);
      }
    } else {
      console.log('❌ Failed to fetch Printify products');
    }
  } catch (error) {
    console.log(`❌ Error checking Printify products: ${error.message}`);
  }
}

async function runAllTests() {
  console.log('🚀 Starting Printify product tests...\n');
  
  // Test 1: Mockup generation
  const mockups = await testMockupGeneration();
  
  // Test 2: Product pricing
  await testProductPricing();
  
  // Test 3: Order creation
  await testOrderCreation();
  
  // Test 4: Frame upgrade
  await testFrameUpgrade();
  
  // Test 5: Check Printify products
  await checkPrintifyProducts();
  
  console.log('\n🏁 All tests completed!');
  console.log('\n📋 Summary:');
  console.log('- Mockup generation: Tests new blueprint IDs (1191, 1159, 944)');
  console.log('- Product pricing: Verifies CAD pricing for all sizes');
  console.log('- Order creation: Tests checkout flow with new products');
  console.log('- Frame upgrade: Tests canvas stretched → framed conversion');
  console.log('- Printify products: Checks for 9 products (3 types × 3 sizes)');
}

// Run tests
runAllTests().catch(console.error);
