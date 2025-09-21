#!/usr/bin/env node

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const TOKEN = process.env.PRINTIFY_API_TOKEN;
const BASE_URL = 'https://api.printify.com/v1';

async function fetchFromPrintify(endpoint) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': 'PawPop-NextJS'
    }
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error: ${response.status} - ${errorText}`);
  }
  
  return response.json();
}

async function checkBlueprint494() {
  console.log('🔍 Checking Blueprint 494 (Giclée Art Print) as alternative...\n');
  
  try {
    // Get blueprint details
    const blueprint = await fetchFromPrintify('/catalog/blueprints/494.json');
    console.log(`📋 Blueprint Details:`);
    console.log(`   Title: ${blueprint.title}`);
    console.log(`   Description: ${blueprint.description}`);
    console.log(`   Brand: ${blueprint.brand}`);
    
    // Get print providers
    const providers = await fetchFromPrintify('/catalog/blueprints/494/print_providers.json');
    console.log(`\n🏭 Found ${providers.length} providers:`);
    
    for (const provider of providers) {
      console.log(`\n   Provider: ${provider.title} (ID: ${provider.id})`);
      console.log(`   Location: ${provider.location}`);
      
      // Check shipping
      try {
        const shipping = await fetchFromPrintify(`/catalog/blueprints/494/print_providers/${provider.id}/shipping.json`);
        
        if (shipping.profiles && shipping.profiles.length > 0) {
          const countries = shipping.profiles[0].countries || [];
          
          const hasEU = countries.some(c => ['DE', 'FR', 'IT', 'ES', 'NL', 'AT', 'BE', 'DK', 'FI', 'SE', 'NO'].includes(c));
          const hasUK = countries.includes('GB');
          const hasUS = countries.includes('US');
          const hasCA = countries.includes('CA');
          
          console.log(`   Shipping Coverage:`);
          console.log(`   - EU: ${hasEU ? '✅' : '❌'}`);
          console.log(`   - UK: ${hasUK ? '✅' : '❌'}`);
          console.log(`   - US: ${hasUS ? '✅' : '❌'}`);
          console.log(`   - CA: ${hasCA ? '✅' : '❌'}`);
          console.log(`   - Total countries: ${countries.length}`);
          
          if (hasEU && hasUK && hasUS && hasCA) {
            console.log(`   🎉 PERFECT! Ships to all required regions.`);
            
            // Get variants
            try {
              const variants = await fetchFromPrintify(`/catalog/blueprints/494/print_providers/${provider.id}/variants.json`);
              
              if (variants.variants) {
                console.log(`\n   📏 Available Variants (${variants.variants.length} total):`);
                
                // Look for Fine Art or high-quality variants
                const qualityVariants = variants.variants.filter(v => 
                  v.title.toLowerCase().includes('fine art') ||
                  v.title.toLowerCase().includes('giclée') ||
                  v.title.toLowerCase().includes('giclee')
                );
                
                if (qualityVariants.length > 0) {
                  console.log(`\n   🎨 High-Quality Variants:`);
                  qualityVariants.forEach(variant => {
                    console.log(`      - ${variant.title} (ID: ${variant.id})`);
                  });
                  
                  // Check for target sizes
                  console.log(`\n   🎯 Target Sizes Available:`);
                  const targetSizes = ['12″ x 18″', '18″ x 24″', '20″ x 30″'];
                  const foundVariants = [];
                  
                  targetSizes.forEach(size => {
                    const variant = qualityVariants.find(v => v.title.includes(size));
                    if (variant) {
                      console.log(`      ✅ ${size}: ${variant.title} (ID: ${variant.id})`);
                      foundVariants.push({ size, id: variant.id, title: variant.title });
                    } else {
                      console.log(`      ❌ ${size}: Not found`);
                    }
                  });
                  
                  if (foundVariants.length === 3) {
                    console.log(`\n   🏆 PERFECT MATCH! All target sizes available in high quality.`);
                    console.log(`   📋 Blueprint: 494`);
                    console.log(`   🏭 Provider: ${provider.id} (${provider.title})`);
                    console.log(`   📦 Variant IDs: ${foundVariants.map(v => v.id).join(', ')}`);
                  }
                } else {
                  console.log(`\n   📄 All Variants:`);
                  variants.variants.slice(0, 10).forEach(variant => {
                    console.log(`      - ${variant.title} (ID: ${variant.id})`);
                  });
                }
              }
            } catch (e) {
              console.log(`   ❌ Could not fetch variants: ${e.message}`);
            }
          }
        }
      } catch (e) {
        console.log(`   ❌ Could not check shipping: ${e.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkBlueprint494();
