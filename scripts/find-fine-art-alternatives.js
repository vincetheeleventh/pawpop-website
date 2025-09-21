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

async function findFineArtAlternatives() {
  console.log('🔍 Finding alternative blueprints with Fine Art paper and global shipping...\n');
  
  try {
    // Get all blueprints
    const blueprints = await fetchFromPrintify('/catalog/blueprints.json');
    
    // Filter for art print related blueprints
    const artPrintBlueprints = blueprints.filter(bp => 
      (bp.title.toLowerCase().includes('poster') ||
       bp.title.toLowerCase().includes('print') ||
       bp.title.toLowerCase().includes('art') ||
       bp.title.toLowerCase().includes('paper')) &&
      bp.id !== 1220 // Exclude the one we already checked
    );
    
    console.log(`Found ${artPrintBlueprints.length} alternative art print blueprints to check...\n`);
    
    for (const bp of artPrintBlueprints.slice(0, 8)) { // Check first 8
      console.log(`📋 Blueprint ${bp.id}: ${bp.title}`);
      
      try {
        // Get print providers
        const providers = await fetchFromPrintify(`/catalog/blueprints/${bp.id}/print_providers.json`);
        
        for (const provider of providers.slice(0, 2)) { // Check first 2 providers
          try {
            // Check shipping
            const shipping = await fetchFromPrintify(`/catalog/blueprints/${bp.id}/print_providers/${provider.id}/shipping.json`);
            
            if (shipping.profiles && shipping.profiles.length > 0) {
              const countries = shipping.profiles[0].countries || [];
              const hasEU = countries.some(c => ['DE', 'FR', 'IT', 'ES', 'NL'].includes(c));
              const hasUK = countries.includes('GB');
              const hasUS = countries.includes('US');
              const hasCA = countries.includes('CA');
              
              if (hasEU && hasUK && hasUS && hasCA) {
                console.log(`   ✅ ${provider.title} (ID: ${provider.id}) - Ships globally!`);
                
                // Check for Fine Art variants
                try {
                  const variants = await fetchFromPrintify(`/catalog/blueprints/${bp.id}/print_providers/${provider.id}/variants.json`);
                  
                  const fineArtVariants = variants.variants?.filter(v => 
                    v.title.toLowerCase().includes('fine art')
                  ) || [];
                  
                  if (fineArtVariants.length > 0) {
                    console.log(`      🎨 Has Fine Art paper! (${fineArtVariants.length} variants)`);
                    
                    // Check for target sizes
                    const targetSizes = ['12″ x 18″', '18″ x 24″', '20″ x 30″'];
                    const foundSizes = [];
                    
                    targetSizes.forEach(size => {
                      const variant = fineArtVariants.find(v => v.title.includes(size));
                      if (variant) {
                        foundSizes.push(`${size} (ID: ${variant.id})`);
                      }
                    });
                    
                    if (foundSizes.length > 0) {
                      console.log(`      🎯 Target sizes available: ${foundSizes.join(', ')}`);
                      console.log(`      🏆 PERFECT MATCH! Blueprint ${bp.id} with provider ${provider.id}`);
                    } else {
                      console.log(`      ⚠️ No target sizes found in Fine Art`);
                    }
                  } else {
                    console.log(`      ❌ No Fine Art paper available`);
                  }
                } catch (e) {
                  console.log(`      ⚠️ Could not check variants`);
                }
              }
            }
          } catch (e) {
            // Skip providers with errors
          }
        }
      } catch (e) {
        console.log(`   ❌ Could not check providers for blueprint ${bp.id}`);
      }
      
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

findFineArtAlternatives();
