#!/usr/bin/env node

/**
 * Search for available canvas blueprints
 */

require('dotenv').config({ path: '.env.local' });

const PRINTIFY_API_URL = 'https://api.printify.com/v1';

async function findCanvasBlueprints() {
  console.log('🔍 SEARCHING FOR CANVAS BLUEPRINTS\n');

  if (!process.env.PRINTIFY_API_TOKEN) {
    console.error('❌ PRINTIFY_API_TOKEN not configured');
    process.exit(1);
  }

  try {
    // Get all blueprints
    console.log('📋 Fetching all available blueprints...');

    const response = await fetch(`${PRINTIFY_API_URL}/catalog/blueprints.json`, {
      headers: {
        "Authorization": `Bearer ${process.env.PRINTIFY_API_TOKEN}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error: ${response.status} - ${errorText}`);
      process.exit(1);
    }

    const data = await response.json();
    console.log(`✅ Found ${data.length} total blueprints`);

    // Filter for canvas-related blueprints
    const canvasBlueprints = data.filter(blueprint => 
      blueprint.title && (
        blueprint.title.toLowerCase().includes('canvas') ||
        blueprint.title.toLowerCase().includes('frame')
      )
    );

    console.log(`\n🎨 CANVAS/FRAME BLUEPRINTS (${canvasBlueprints.length} found):`);
    console.log('=' .repeat(80));

    canvasBlueprints.forEach((blueprint, index) => {
      console.log(`${index + 1}. ID: ${blueprint.id}`);
      console.log(`   Title: ${blueprint.title}`);
      console.log(`   Brand: ${blueprint.brand}`);
      console.log(`   Description: ${blueprint.description?.substring(0, 100)}...`);
      console.log('   ---');
    });

    // Let's specifically check some promising ones
    const framingCandidates = canvasBlueprints.filter(bp => 
      bp.title.toLowerCase().includes('frame') && 
      bp.title.toLowerCase().includes('canvas')
    );

    if (framingCandidates.length > 0) {
      console.log(`\n🖼️ FRAMED CANVAS CANDIDATES (${framingCandidates.length} found):`);
      console.log('=' .repeat(80));

      for (const blueprint of framingCandidates.slice(0, 3)) { // Check first 3
        console.log(`\n🔍 Checking Blueprint ${blueprint.id}: ${blueprint.title}`);
        
        try {
          const detailResponse = await fetch(`${PRINTIFY_API_URL}/catalog/blueprints/${blueprint.id}.json`, {
            headers: {
              "Authorization": `Bearer ${process.env.PRINTIFY_API_TOKEN}`,
              "Content-Type": "application/json"
            }
          });

          if (detailResponse.ok) {
            const detailData = await detailResponse.json();
            console.log(`   Print Providers: ${detailData.print_providers?.length || 0}`);
            
            if (detailData.print_providers && detailData.print_providers.length > 0) {
              detailData.print_providers.forEach(provider => {
                console.log(`      - ID: ${provider.id}, Title: ${provider.title}`);
              });

              // Check variants for first provider
              const firstProvider = detailData.print_providers[0];
              console.log(`\n   Checking variants for provider ${firstProvider.id}...`);
              
              try {
                const variantsResponse = await fetch(`${PRINTIFY_API_URL}/catalog/blueprints/${blueprint.id}/print_providers/${firstProvider.id}/variants.json`, {
                  headers: {
                    "Authorization": `Bearer ${process.env.PRINTIFY_API_TOKEN}`,
                    "Content-Type": "application/json"
                  }
                });

                if (variantsResponse.ok) {
                  const variantsData = await variantsResponse.json();
                  console.log(`   ✅ Found ${variantsData.variants?.length || 0} variants`);
                  
                  if (variantsData.variants && variantsData.variants.length > 0) {
                    // Show first few variants
                    variantsData.variants.slice(0, 5).forEach((variant, index) => {
                      console.log(`      ${index + 1}. ID: ${variant.id} - ${variant.title} - $${(variant.price / 100).toFixed(2)}`);
                    });

                    // Look for our target sizes
                    const targetSizes = ['12x18', '16x24', '20x30'];
                    const matchingVariants = [];

                    targetSizes.forEach(size => {
                      const variant = variantsData.variants.find(v => 
                        v.title && (
                          v.title.includes(size) || 
                          v.title.includes(size.replace('x', '″ × ') + '″')
                        )
                      );
                      if (variant) {
                        matchingVariants.push({ size, variant });
                      }
                    });

                    if (matchingVariants.length > 0) {
                      console.log(`\n   🎯 MATCHING SIZES FOUND:`);
                      matchingVariants.forEach(({ size, variant }) => {
                        console.log(`      ${size}: ID ${variant.id} - ${variant.title} - $${(variant.price / 100).toFixed(2)}`);
                      });

                      console.log(`\n   🔧 SUGGESTED CONFIGURATION:`);
                      console.log(`   Blueprint ID: ${blueprint.id}`);
                      console.log(`   Print Provider ID: ${firstProvider.id}`);
                      console.log(`   Variants:`);
                      matchingVariants.forEach(({ size, variant }) => {
                        console.log(`     { id: ${variant.id}, size: '${size}', price: ${variant.price} }, // $${(variant.price / 100).toFixed(2)}`);
                      });
                    }
                  }
                }
              } catch (variantError) {
                console.log(`   ❌ Error fetching variants: ${variantError.message}`);
              }
            }
          }
        } catch (error) {
          console.log(`   ❌ Error fetching details: ${error.message}`);
        }
      }
    }

  } catch (error) {
    console.error('💥 Error:', error);
    process.exit(1);
  }
}

// Run the script
findCanvasBlueprints();
