#!/usr/bin/env node

/**
 * Direct Printify API integration test for new product configurations
 * Tests the actual Printify API calls with new blueprint IDs
 */

require('dotenv').config({ path: '.env.local' });

const PRINTIFY_API_URL = 'https://api.printify.com/v1';
const TOKEN = process.env.PRINTIFY_API_TOKEN;
const SHOP_ID = process.env.PRINTIFY_SHOP_ID;

// New product configurations to test
const NEW_PRODUCTS = {
  ART_PRINT: {
    blueprint_id: 1191, // Photo Art Paper Posters
    print_provider_id: 27, // Print Geek
    name: 'Art Print'
  },
  CANVAS_STRETCHED: {
    blueprint_id: 1159, // Matte Canvas, Stretched, 1.25"
    print_provider_id: 105, // Jondo
    name: 'Canvas Stretched'
  },
  CANVAS_FRAMED: {
    blueprint_id: 944, // Matte Canvas, Framed Multi-color
    print_provider_id: 105, // Jondo
    name: 'Canvas Framed'
  }
};

async function fetchFromPrintify(endpoint, options = {}) {
  if (!TOKEN || !SHOP_ID) {
    throw new Error('Printify credentials not configured');
  }

  const response = await fetch(`${PRINTIFY_API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': 'PawPop-Test',
      ...options.headers
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Printify API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

async function testBlueprintAccess() {
  console.log('🔍 Testing access to new blueprint IDs...\n');
  
  for (const [productType, config] of Object.entries(NEW_PRODUCTS)) {
    try {
      console.log(`📋 Testing ${config.name} (Blueprint ${config.blueprint_id}):`);
      
      // Test blueprint access
      const blueprint = await fetchFromPrintify(`/catalog/blueprints/${config.blueprint_id}.json`);
      console.log(`  ✅ Blueprint accessible: ${blueprint.title}`);
      
      // Test print provider variants
      const variants = await fetchFromPrintify(
        `/catalog/blueprints/${config.blueprint_id}/print_providers/${config.print_provider_id}/variants.json`
      );
      
      console.log(`  ✅ Found ${variants.variants?.length || 0} variants`);
      
      // Show first few variants for verification
      if (variants.variants && variants.variants.length > 0) {
        variants.variants.slice(0, 3).forEach((variant, index) => {
          console.log(`    ${index + 1}. ${variant.title} (ID: ${variant.id})`);
        });
      }
      
      console.log('');
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}\n`);
    }
  }
}

async function testProductCreation() {
  console.log('🏭 Testing product creation with new blueprints...\n');
  
  // Test image (base64 encoded 1x1 pixel)
  const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
  
  try {
    // Upload test image
    console.log('📤 Uploading test image...');
    const uploadResponse = await fetchFromPrintify('/uploads/images.json', {
      method: 'POST',
      body: JSON.stringify({
        file_name: 'pawpop-test.png',
        contents: testImageBase64
      })
    });
    
    console.log(`✅ Image uploaded: ${uploadResponse.id}\n`);
    
    // Test creating one product from each type
    for (const [productType, config] of Object.entries(NEW_PRODUCTS)) {
      try {
        console.log(`🎨 Creating ${config.name} product...`);
        
        // Get variants for this blueprint/provider
        const variantsResponse = await fetchFromPrintify(
          `/catalog/blueprints/${config.blueprint_id}/print_providers/${config.print_provider_id}/variants.json`
        );
        
        if (!variantsResponse.variants || variantsResponse.variants.length === 0) {
          console.log(`  ⚠️ No variants found for ${config.name}`);
          continue;
        }
        
        // Use first variant for testing
        const testVariant = variantsResponse.variants[0];
        
        const productData = {
          title: `PawPop Test ${config.name} - ${Date.now()}`,
          description: `Test product for ${config.name} integration`,
          blueprint_id: config.blueprint_id,
          print_provider_id: config.print_provider_id,
          variants: [{
            id: testVariant.id,
            price: 2999, // $29.99 test price
            is_enabled: true
          }],
          print_areas: [{
            variant_ids: [testVariant.id],
            placeholders: [{
              position: 'front',
              images: [{
                id: uploadResponse.id,
                x: 0.5,
                y: 0.5,
                scale: 1.0,
                angle: 0
              }]
            }]
          }],
          tags: ['test', 'pawpop', 'integration']
        };
        
        const product = await fetchFromPrintify(`/shops/${SHOP_ID}/products.json`, {
          method: 'POST',
          body: JSON.stringify(productData)
        });
        
        console.log(`  ✅ Product created: ${product.id}`);
        console.log(`  📊 Variant: ${testVariant.title} (ID: ${testVariant.id})`);
        
        // Fetch full product to check mockups
        const fullProduct = await fetchFromPrintify(`/shops/${SHOP_ID}/products/${product.id}.json`);
        console.log(`  🖼️ Generated ${fullProduct.images?.length || 0} mockup images`);
        
        // Clean up - delete test product
        await fetchFromPrintify(`/shops/${SHOP_ID}/products/${product.id}.json`, {
          method: 'DELETE'
        });
        console.log(`  🗑️ Test product deleted\n`);
        
      } catch (error) {
        console.log(`  ❌ Error creating ${config.name}: ${error.message}\n`);
      }
    }
    
  } catch (error) {
    console.log(`❌ Error in product creation test: ${error.message}\n`);
  }
}

async function checkExistingProducts() {
  console.log('📦 Checking existing PawPop products in shop...\n');
  
  try {
    const response = await fetchFromPrintify(`/shops/${SHOP_ID}/products.json`);
    const products = response.data || [];
    
    console.log(`📊 Total products in shop: ${products.length}`);
    
    // Filter for PawPop products
    const pawpopProducts = products.filter(p => 
      p.title?.toLowerCase().includes('pawpop') || 
      p.tags?.includes('pawpop') ||
      p.tags?.includes('preview')
    );
    
    console.log(`🐾 PawPop-related products: ${pawpopProducts.length}\n`);
    
    if (pawpopProducts.length > 0) {
      console.log('Recent PawPop products:');
      pawpopProducts.slice(0, 10).forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.title}`);
        console.log(`     ID: ${product.id}, Blueprint: ${product.blueprint_id}`);
        console.log(`     Variants: ${product.variants?.length || 0}, Images: ${product.images?.length || 0}`);
        console.log('');
      });
    }
    
    // Group by blueprint ID to see distribution
    const blueprintCounts = {};
    pawpopProducts.forEach(p => {
      blueprintCounts[p.blueprint_id] = (blueprintCounts[p.blueprint_id] || 0) + 1;
    });
    
    console.log('Products by Blueprint ID:');
    Object.entries(blueprintCounts).forEach(([blueprintId, count]) => {
      const productType = blueprintId === '1191' ? 'Art Print' :
                         blueprintId === '1159' ? 'Canvas Stretched' :
                         blueprintId === '944' ? 'Canvas Framed' : 'Unknown';
      console.log(`  Blueprint ${blueprintId} (${productType}): ${count} products`);
    });
    
  } catch (error) {
    console.log(`❌ Error checking products: ${error.message}`);
  }
}

async function runTests() {
  console.log('🚀 Starting Printify Integration Tests\n');
  console.log('=' .repeat(50));
  
  if (!TOKEN || !SHOP_ID) {
    console.log('❌ Printify credentials not configured');
    console.log('Please set PRINTIFY_API_TOKEN and PRINTIFY_SHOP_ID in .env file');
    return;
  }
  
  console.log(`🔑 Using Shop ID: ${SHOP_ID}`);
  console.log(`🔑 Token configured: ${TOKEN ? 'Yes' : 'No'}\n`);
  
  try {
    // Test 1: Blueprint access
    await testBlueprintAccess();
    
    // Test 2: Product creation
    await testProductCreation();
    
    // Test 3: Check existing products
    await checkExistingProducts();
    
    console.log('\n' + '=' .repeat(50));
    console.log('🏁 All tests completed!');
    console.log('\n📋 Summary:');
    console.log('- Blueprint Access: Tests if new blueprint IDs are accessible');
    console.log('- Product Creation: Tests creating products with new blueprints');
    console.log('- Existing Products: Shows current PawPop products in shop');
    console.log('\nIf all tests pass, the new product configurations are working correctly!');
    
  } catch (error) {
    console.log(`\n❌ Test suite failed: ${error.message}`);
  }
}

// Run the tests
runTests().catch(console.error);
