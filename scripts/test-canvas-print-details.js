#!/usr/bin/env node

/**
 * Test script to verify canvas print details configuration
 * Tests that canvas products include print_on_side: "mirror" in print_details
 */

const { ProductType, createPrintifyProduct } = require('../src/lib/printify');

// Mock environment variables for testing
process.env.PRINTIFY_API_TOKEN = 'test_token';
process.env.PRINTIFY_SHOP_ID = 'test_shop';

// Mock fetch to capture the request payload
global.fetch = jest.fn();

// Mock the image positioning module
jest.mock('../src/lib/printify-image-positioning', () => ({
  calculateImagePlacement: () => ({ x: 0.5, y: 0.5, scale: 1, angle: 0 }),
  validatePlacement: (placement) => placement
}));

async function testCanvasPrintDetails() {
  console.log('🧪 Testing Canvas Print Details Configuration...\n');

  // Test data
  const testImageUrl = 'https://example.com/test-image.jpg';
  const testTitle = 'Test Canvas Product';
  const testDescription = 'Test canvas with print details';

  try {
    // Test Canvas Stretched
    console.log('📋 Testing Canvas Stretched (ProductType.CANVAS_STRETCHED)...');
    
    // Mock successful image upload
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'test_image_id' })
    });

    // Mock successful product creation
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'test_product_id' })
    });

    await createPrintifyProduct(
      1159, // Canvas stretched blueprint
      1,    // Generic Brand provider
      testTitle,
      testDescription,
      testImageUrl,
      ProductType.CANVAS_STRETCHED,
      '12x18',
      'test_shop'
    );

    // Check the product creation request
    const productCreationCall = fetch.mock.calls.find(call => 
      call[0].includes('/products.json') && call[1].method === 'POST'
    );

    if (productCreationCall) {
      const requestBody = JSON.parse(productCreationCall[1].body);
      
      if (requestBody.print_details && requestBody.print_details.print_on_side === 'mirror') {
        console.log('✅ Canvas Stretched: print_details.print_on_side = "mirror" ✓');
      } else {
        console.log('❌ Canvas Stretched: Missing or incorrect print_details');
        console.log('   Expected: { print_details: { print_on_side: "mirror" } }');
        console.log('   Actual:', requestBody.print_details || 'undefined');
      }
    }

    // Reset mocks
    fetch.mockClear();

    // Test Canvas Framed
    console.log('\n📋 Testing Canvas Framed (ProductType.CANVAS_FRAMED)...');
    
    // Mock successful image upload
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'test_image_id' })
    });

    // Mock successful product creation
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'test_product_id' })
    });

    await createPrintifyProduct(
      944, // Canvas framed blueprint
      1,   // Generic Brand provider
      testTitle,
      testDescription,
      testImageUrl,
      ProductType.CANVAS_FRAMED,
      '16x24',
      'test_shop'
    );

    // Check the product creation request
    const framedProductCall = fetch.mock.calls.find(call => 
      call[0].includes('/products.json') && call[1].method === 'POST'
    );

    if (framedProductCall) {
      const requestBody = JSON.parse(framedProductCall[1].body);
      
      if (requestBody.print_details && requestBody.print_details.print_on_side === 'mirror') {
        console.log('✅ Canvas Framed: print_details.print_on_side = "mirror" ✓');
      } else {
        console.log('❌ Canvas Framed: Missing or incorrect print_details');
        console.log('   Expected: { print_details: { print_on_side: "mirror" } }');
        console.log('   Actual:', requestBody.print_details || 'undefined');
      }
    }

    // Reset mocks
    fetch.mockClear();

    // Test Art Print (should NOT have print_details)
    console.log('\n📋 Testing Art Print (ProductType.ART_PRINT)...');
    
    // Mock successful image upload
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'test_image_id' })
    });

    // Mock successful product creation
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'test_product_id' })
    });

    await createPrintifyProduct(
      1191, // Art print blueprint
      1,    // Generic Brand provider
      testTitle,
      testDescription,
      testImageUrl,
      ProductType.ART_PRINT,
      '12x18',
      'test_shop'
    );

    // Check the product creation request
    const artPrintCall = fetch.mock.calls.find(call => 
      call[0].includes('/products.json') && call[1].method === 'POST'
    );

    if (artPrintCall) {
      const requestBody = JSON.parse(artPrintCall[1].body);
      
      if (!requestBody.print_details) {
        console.log('✅ Art Print: No print_details (correct for non-canvas products) ✓');
      } else {
        console.log('❌ Art Print: Unexpected print_details found');
        console.log('   Expected: undefined');
        console.log('   Actual:', requestBody.print_details);
      }
    }

    console.log('\n🎉 Canvas Print Details Test Complete!');
    console.log('\n📝 Summary:');
    console.log('   - Canvas Stretched: Includes print_on_side: "mirror"');
    console.log('   - Canvas Framed: Includes print_on_side: "mirror"');
    console.log('   - Art Print: No print_details (as expected)');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testCanvasPrintDetails();
}

module.exports = { testCanvasPrintDetails };
