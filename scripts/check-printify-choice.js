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

async function checkPrintifyChoice() {
  console.log('🔍 Checking Printify Choice provider for Blueprint 1220...\n');
  
  try {
    // Check Printify Choice provider (ID: 99)
    console.log('🏭 Printify Choice Provider (ID: 99):');
    
    // Check shipping
    try {
      const shipping = await fetchFromPrintify('/catalog/blueprints/1220/print_providers/99/shipping.json');
      
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
        
        // Show all countries for reference
        console.log(`\n   📍 All shipping countries: ${countries.join(', ')}`);
      }
    } catch (e) {
      console.log(`   ❌ Could not check shipping: ${e.message}`);
    }
    
    // Get variants for Printify Choice
    try {
      console.log('\n   📏 Available Variants (Printify Choice):');
      const variants = await fetchFromPrintify('/catalog/blueprints/1220/print_providers/99/variants.json');
      
      if (variants.variants) {
        // Look for Fine Art variants (if available)
        const fineArtVariants = variants.variants.filter(v => 
          v.title.includes('Fine Art')
        );
        
        if (fineArtVariants.length > 0) {
          console.log('\n   🎨 Fine Art Variants:');
          fineArtVariants.forEach(variant => {
            console.log(`      - ${variant.title} (ID: ${variant.id})`);
          });
          
          // Check for target sizes
          console.log('\n   🎯 Target Sizes in Fine Art:');
          const targetSizes = ['12″ x 18″', '18″ x 24″', '20″ x 30″'];
          
          targetSizes.forEach(size => {
            const variant = fineArtVariants.find(v => v.title.includes(size));
            if (variant) {
              console.log(`      ✅ ${size}: ${variant.title} (ID: ${variant.id})`);
            } else {
              console.log(`      ❌ ${size}: Not found`);
            }
          });
        } else {
          console.log('\n   ❌ No Fine Art variants found for Printify Choice');
          
          // Show what paper types are available
          const paperTypes = {};
          variants.variants.forEach(variant => {
            const paperType = variant.title.includes('Semi Glossy') ? 'Semi Glossy' : 
                             variant.title.includes('Matte') ? 'Matte' : 'Other';
            
            if (!paperTypes[paperType]) {
              paperTypes[paperType] = [];
            }
            paperTypes[paperType].push(variant);
          });
          
          console.log('\n   📄 Available Paper Types:');
          Object.keys(paperTypes).forEach(paperType => {
            console.log(`      ${paperType}: ${paperTypes[paperType].length} variants`);
          });
        }
      }
    } catch (e) {
      console.log(`   ❌ Could not fetch variants: ${e.message}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkPrintifyChoice();
