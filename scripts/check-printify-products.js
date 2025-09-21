#!/usr/bin/env node

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

async function checkArtPrintProducts() {
  console.log('🔍 Checking Printify art print products for international shipping...\n');
  
  try {
    // Check current art print blueprint (1191)
    console.log('📋 Checking current art print blueprint (1191)...');
    
    const providers = await fetchFromPrintify('/catalog/blueprints/1191/print_providers.json');
    console.log(`Found ${providers.length} providers for blueprint 1191:`);
    
    for (const provider of providers) {
      console.log(`\n🏭 Provider: ${provider.title} (ID: ${provider.id})`);
      console.log(`   Location: ${provider.location}`);
      
      try {
        // Check shipping for this provider
        const shipping = await fetchFromPrintify(`/catalog/blueprints/1191/print_providers/${provider.id}/shipping.json`);
        
        if (shipping.profiles && shipping.profiles.length > 0) {
          const countries = shipping.profiles[0].countries || [];
          
          // Check for required regions
          const hasEU = countries.some(c => ['DE', 'FR', 'IT', 'ES', 'NL', 'AT', 'BE', 'DK', 'FI', 'SE', 'NO'].includes(c));
          const hasUK = countries.includes('GB');
          const hasUS = countries.includes('US');
          const hasCA = countries.includes('CA');
          
          console.log(`   Shipping regions:`);
          console.log(`   - EU: ${hasEU ? '✅' : '❌'}`);
          console.log(`   - UK: ${hasUK ? '✅' : '❌'}`);
          console.log(`   - US: ${hasUS ? '✅' : '❌'}`);
          console.log(`   - CA: ${hasCA ? '✅' : '❌'}`);
          console.log(`   - Total countries: ${countries.length}`);
          
          if (hasEU && hasUK && hasUS && hasCA) {
            console.log(`   🎯 PERFECT MATCH! This provider ships to all required regions.`);
            
            // Get variants for this provider
            try {
              const variants = await fetchFromPrintify(`/catalog/blueprints/1191/print_providers/${provider.id}/variants.json`);
              console.log(`   📏 Available sizes: ${variants.variants?.length || 0} variants`);
              
              if (variants.variants) {
                variants.variants.slice(0, 5).forEach(variant => {
                  console.log(`      - ${variant.title} (ID: ${variant.id})`);
                });
              }
            } catch (e) {
              console.log(`   ⚠️ Could not fetch variants: ${e.message}`);
            }
          }
        } else {
          console.log(`   ⚠️ No shipping profiles found`);
        }
        
      } catch (e) {
        console.log(`   ❌ Error checking shipping: ${e.message}`);
      }
    }
    
    // Also check some alternative art print blueprints
    console.log('\n\n🔍 Checking alternative art print blueprints...');
    
    const alternativeBlueprints = [
      { id: 494, name: 'Giclee Art Print' },
      { id: 1191, name: 'Photo Art Paper Posters' },
      { id: 1159, name: 'Matte Canvas' },
      { id: 944, name: 'Framed Canvas' }
    ];
    
    for (const blueprint of alternativeBlueprints) {
      console.log(`\n📋 Blueprint ${blueprint.id}: ${blueprint.name}`);
      
      try {
        const bpProviders = await fetchFromPrintify(`/catalog/blueprints/${blueprint.id}/print_providers.json`);
        
        for (const provider of bpProviders.slice(0, 2)) { // Check first 2 providers
          try {
            const shipping = await fetchFromPrintify(`/catalog/blueprints/${blueprint.id}/print_providers/${provider.id}/shipping.json`);
            
            if (shipping.profiles && shipping.profiles.length > 0) {
              const countries = shipping.profiles[0].countries || [];
              const hasEU = countries.some(c => ['DE', 'FR', 'IT', 'ES', 'NL'].includes(c));
              const hasUK = countries.includes('GB');
              const hasUS = countries.includes('US');
              const hasCA = countries.includes('CA');
              
              if (hasEU && hasUK && hasUS && hasCA) {
                console.log(`   ✅ ${provider.title} (ID: ${provider.id}) - Ships globally!`);
              } else {
                console.log(`   ⚠️ ${provider.title} (ID: ${provider.id}) - Limited shipping`);
              }
            }
          } catch (e) {
            // Skip providers with shipping errors
          }
        }
      } catch (e) {
        console.log(`   ❌ Could not check blueprint ${blueprint.id}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkArtPrintProducts();
