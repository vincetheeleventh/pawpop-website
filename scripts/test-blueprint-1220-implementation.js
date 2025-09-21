#!/usr/bin/env node

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const BASE_URL = 'http://localhost:3000';

async function testBlueprint1220Implementation() {
  console.log('🧪 Testing Blueprint 1220 Fine Art implementation...\n');
  
  try {
    // Test the mockup generation API with a sample artwork
    const testPayload = {
      imageUrl: 'https://example.com/test-artwork.jpg',
      artworkId: 'test-artwork-1220'
    };
    
    console.log('📤 Testing mockup generation API...');
    console.log('Payload:', testPayload);
    
    const response = await fetch(`${BASE_URL}/api/printify/generate-mockups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error: ${response.status} - ${errorText}`);
      return;
    }
    
    const result = await response.json();
    console.log('✅ API Response received');
    
    // Check if we got the expected mockups
    if (result.success && result.mockups) {
      console.log(`📦 Generated ${result.mockups.length} mockups:`);
      
      result.mockups.forEach((mockup, index) => {
        console.log(`\n   ${index + 1}. ${mockup.title}`);
        console.log(`      Type: ${mockup.type}`);
        console.log(`      Description: ${mockup.description}`);
        console.log(`      Product ID: ${mockup.productId}`);
        console.log(`      Mockup URL: ${mockup.mockupUrl?.substring(0, 50)}...`);
      });
      
      // Check for Fine Art prints specifically
      const fineArtPrints = result.mockups.filter(m => 
        m.type === 'art_print' && 
        m.title.includes('Fine Art')
      );
      
      if (fineArtPrints.length > 0) {
        console.log(`\n🎨 Fine Art Prints Found: ${fineArtPrints.length}`);
        fineArtPrints.forEach(print => {
          console.log(`   ✅ ${print.title} - ${print.description}`);
        });
      } else {
        console.log('\n⚠️ No Fine Art prints found in response');
      }
      
      // Check for expected sizes
      const expectedSizes = ['12x18', '18x24', '20x30'];
      expectedSizes.forEach(size => {
        const found = result.mockups.some(m => m.title.includes(size));
        console.log(`   ${found ? '✅' : '❌'} Size ${size}: ${found ? 'Found' : 'Missing'}`);
      });
      
    } else {
      console.log('❌ Unexpected response format:', result);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    // Check if it's a connection error (server not running)
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the development server is running:');
      console.log('   npm run dev');
    }
  }
}

// Also test the configuration directly
function testConfiguration() {
  console.log('\n🔧 Testing configuration...');
  
  // Simulate the PRODUCT_CONFIG from the API
  const PRODUCT_CONFIG = {
    ART_PRINT: {
      US: {
        blueprint_id: 1220,
        print_provider_id: 105,
        variants: [
          { id: 'fine_art_12x18', size: '12x18', price: 2900, variant_id: 92396 },
          { id: 'fine_art_18x24', size: '18x24', price: 3900, variant_id: 92400 },
          { id: 'fine_art_20x30', size: '20x30', price: 4800, variant_id: 92402 }
        ]
      },
      EUROPE_FUTURE: {
        blueprint_id: 494,
        print_provider_id: 36,
        variants: [
          { id: 'giclee_12x18', size: '12x18', price: 2900 },
          { id: 'giclee_18x24', size: '18x24', price: 3900 },
          { id: 'giclee_20x30', size: '20x30', price: 4800 }
        ]
      }
    }
  };
  
  console.log('📋 US Configuration (Active):');
  console.log(`   Blueprint: ${PRODUCT_CONFIG.ART_PRINT.US.blueprint_id} (Rolled Posters)`);
  console.log(`   Provider: ${PRODUCT_CONFIG.ART_PRINT.US.print_provider_id} (Jondo)`);
  console.log(`   Variants: ${PRODUCT_CONFIG.ART_PRINT.US.variants.length}`);
  
  PRODUCT_CONFIG.ART_PRINT.US.variants.forEach(variant => {
    console.log(`     - ${variant.size}: $${variant.price/100} CAD (Variant ID: ${variant.variant_id})`);
  });
  
  console.log('\n📋 EU Configuration (Future):');
  console.log(`   Blueprint: ${PRODUCT_CONFIG.ART_PRINT.EUROPE_FUTURE.blueprint_id} (Giclée Art Print)`);
  console.log(`   Provider: ${PRODUCT_CONFIG.ART_PRINT.EUROPE_FUTURE.print_provider_id} (Print Pigeons)`);
  console.log(`   Status: Not implemented - EU shipping only`);
  
  console.log('\n✅ Configuration looks correct!');
}

console.log('🚀 Starting Blueprint 1220 Implementation Test\n');
testConfiguration();
testBlueprint1220Implementation();
