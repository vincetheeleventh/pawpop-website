#!/usr/bin/env node

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const TOKEN = process.env.PRINTIFY_API_TOKEN;
const BASE_URL = 'https://api.printify.com/v1';

if (!TOKEN) {
  console.error('❌ PRINTIFY_API_TOKEN not found in environment');
  process.exit(1);
}

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

async function checkBlueprint1220() {
  console.log('🔍 Checking Blueprint 1220 (Rolled Posters by Jondo)...\n');
  
  try {
    // Get blueprint details
    console.log('📋 Blueprint Details:');
    const blueprint = await fetchFromPrintify('/catalog/blueprints/1220.json');
    console.log(`   Title: ${blueprint.title}`);
    console.log(`   Description: ${blueprint.description}`);
    console.log(`   Brand: ${blueprint.brand}`);
    
    // Get print providers
    console.log('\n🏭 Print Providers:');
    const providers = await fetchFromPrintify('/catalog/blueprints/1220/print_providers.json');
    
    for (const provider of providers) {
      console.log(`\n   Provider: ${provider.title} (ID: ${provider.id})`);
      console.log(`   Location: ${provider.location}`);
      
      // Check if this is Jondo
      if (provider.title.toLowerCase().includes('jondo') || provider.id === 105) {
        console.log('   🎯 This is Jondo!');
        
        // Check shipping
        try {
          const shipping = await fetchFromPrintify(`/catalog/blueprints/1220/print_providers/${provider.id}/shipping.json`);
          
          if (shipping.profiles && shipping.profiles.length > 0) {
            const countries = shipping.profiles[0].countries || [];
            
            const hasEU = countries.some(c => ['DE', 'FR', 'IT', 'ES', 'NL', 'AT', 'BE', 'DK', 'FI', 'SE', 'NO'].includes(c));
            const hasUK = countries.includes('GB');
            const hasUS = countries.includes('US');
            const hasCA = countries.includes('CA');
            
            console.log(`   Shipping Coverage:`);
            console.log(`   - EU: ${hasEU ? '✅' : '❌'} (${countries.filter(c => ['DE', 'FR', 'IT', 'ES', 'NL', 'AT', 'BE', 'DK', 'FI', 'SE', 'NO'].includes(c)).join(', ')})`);
            console.log(`   - UK: ${hasUK ? '✅' : '❌'}`);
            console.log(`   - US: ${hasUS ? '✅' : '❌'}`);
            console.log(`   - CA: ${hasCA ? '✅' : '❌'}`);
            console.log(`   - Total countries: ${countries.length}`);
            
            if (hasEU && hasUK && hasUS && hasCA) {
              console.log(`   🎉 PERFECT! Ships to all required regions.`);
            } else {
              console.log(`   ⚠️ Missing some required regions.`);
            }
          }
        } catch (e) {
          console.log(`   ❌ Could not check shipping: ${e.message}`);
        }
        
        // Get variants (sizes and paper types)
        try {
          console.log('\n   📏 Available Variants:');
          const variants = await fetchFromPrintify(`/catalog/blueprints/1220/print_providers/${provider.id}/variants.json`);
          
          if (variants.variants) {
            // Group by paper type
            const paperTypes = {};
            variants.variants.forEach(variant => {
              const paperType = variant.title.includes('Fine Art') ? 'Fine Art' : 
                               variant.title.includes('Premium') ? 'Premium' : 'Standard';
              
              if (!paperTypes[paperType]) {
                paperTypes[paperType] = [];
              }
              paperTypes[paperType].push(variant);
            });
            
            Object.keys(paperTypes).forEach(paperType => {
              console.log(`\n   📄 ${paperType} Paper:`);
              paperTypes[paperType].forEach(variant => {
                console.log(`      - ${variant.title} (ID: ${variant.id})`);
              });
            });
            
            // Find Fine Art variants for target sizes
            const fineArtVariants = variants.variants.filter(v => 
              v.title.includes('Fine Art')
            );
            
            console.log('\n   🎨 Fine Art Variants for Target Sizes:');
            const targetSizes = ['12″ × 18″', '18″ × 24″', '20″ × 30″'];
            
            targetSizes.forEach(size => {
              const variant = fineArtVariants.find(v => v.title.includes(size));
              if (variant) {
                console.log(`      ✅ ${size}: ${variant.title} (ID: ${variant.id})`);
              } else {
                console.log(`      ❌ ${size}: Not found`);
              }
            });
          }
        } catch (e) {
          console.log(`   ❌ Could not fetch variants: ${e.message}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkBlueprint1220();
