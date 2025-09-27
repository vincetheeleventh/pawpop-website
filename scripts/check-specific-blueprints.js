#!/usr/bin/env node

/**
 * Check specific promising blueprints for framed canvas
 */

require('dotenv').config({ path: '.env.local' });

const PRINTIFY_API_URL = 'https://api.printify.com/v1';

async function checkSpecificBlueprints() {
  console.log('🔍 CHECKING SPECIFIC BLUEPRINTS FOR FRAMED CANVAS\n');

  if (!process.env.PRINTIFY_API_TOKEN) {
    console.error('❌ PRINTIFY_API_TOKEN not configured');
    process.exit(1);
  }

  // Promising blueprints for framed canvas
  const candidates = [
    { id: 492, name: 'Vertical Framed Poster' },
    { id: 540, name: 'Framed Vertical Poster' },
    { id: 764, name: 'Framed Posters' },
    { id: 1130, name: 'Framed Posters, Matte' },
    { id: 1275, name: 'Posters with Wooden Frame' },
    { id: 1502, name: 'Framed Poster, Multi-Color' }
  ];

  for (const candidate of candidates) {
    console.log(`\n🔍 CHECKING BLUEPRINT ${candidate.id}: ${candidate.name}`);
    console.log('=' .repeat(60));

    try {
      const detailResponse = await fetch(`${PRINTIFY_API_URL}/catalog/blueprints/${candidate.id}.json`, {
        headers: {
          "Authorization": `Bearer ${process.env.PRINTIFY_API_TOKEN}`,
          "Content-Type": "application/json"
        }
      });

      if (!detailResponse.ok) {
        console.log(`   ❌ Error fetching blueprint details: ${detailResponse.status}`);
        continue;
      }

      const detailData = await detailResponse.json();
      console.log(`   Print Providers: ${detailData.print_providers?.length || 0}`);
      
      if (detailData.print_providers && detailData.print_providers.length > 0) {
        // Check each print provider
        for (const provider of detailData.print_providers) {
          console.log(`\n   🏭 Provider ${provider.id}: ${provider.title}`);
          
          try {
            const variantsResponse = await fetch(`${PRINTIFY_API_URL}/catalog/blueprints/${candidate.id}/print_providers/${provider.id}/variants.json`, {
              headers: {
                "Authorization": `Bearer ${process.env.PRINTIFY_API_TOKEN}`,
                "Content-Type": "application/json"
              }
            });

            if (variantsResponse.ok) {
              const variantsData = await variantsResponse.json();
              console.log(`      Variants: ${variantsData.variants?.length || 0}`);
              
              if (variantsData.variants && variantsData.variants.length > 0) {
                // Look for our target sizes
                const targetSizes = ['12x18', '16x24', '20x30'];
                const matchingVariants = [];

                targetSizes.forEach(size => {
                  const variant = variantsData.variants.find(v => 
                    v.title && (
                      v.title.includes(size) || 
                      v.title.includes(size.replace('x', '″ × ') + '″') ||
                      v.title.includes(size.replace('x', '" × ') + '"')
                    )
                  );
                  if (variant) {
                    matchingVariants.push({ size, variant });
                  }
                });

                if (matchingVariants.length > 0) {
                  console.log(`      🎯 MATCHING SIZES:`);
                  matchingVariants.forEach(({ size, variant }) => {
                    console.log(`         ${size}: ID ${variant.id} - ${variant.title} - $${(variant.price / 100).toFixed(2)}`);
                  });

                  if (matchingVariants.length >= 3) {
                    console.log(`\n      ✅ COMPLETE MATCH! All 3 sizes found`);
                    console.log(`      🔧 CONFIGURATION:`);
                    console.log(`         Blueprint ID: ${candidate.id}`);
                    console.log(`         Print Provider ID: ${provider.id}`);
                    console.log(`         Variants:`);
                    matchingVariants.forEach(({ size, variant }) => {
                      console.log(`           { id: ${variant.id}, size: '${size}', price: ${variant.price} }, // $${(variant.price / 100).toFixed(2)} - ${variant.title}`);
                    });
                  }
                } else {
                  // Show first few variants to see what's available
                  console.log(`      Available variants (first 5):`);
                  variantsData.variants.slice(0, 5).forEach((variant, index) => {
                    console.log(`         ${index + 1}. ID: ${variant.id} - ${variant.title} - $${(variant.price / 100).toFixed(2)}`);
                  });
                }
              }
            } else {
              console.log(`      ❌ Error fetching variants: ${variantsResponse.status}`);
            }
          } catch (variantError) {
            console.log(`      ❌ Error: ${variantError.message}`);
          }
        }
      } else {
        console.log(`   ❌ No print providers available`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
}

// Run the script
checkSpecificBlueprints();
