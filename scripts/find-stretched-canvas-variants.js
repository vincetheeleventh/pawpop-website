#!/usr/bin/env node

/**
 * Find exact variant IDs for 12x18, 16x24, 20x30 in blueprint 1159 (Stretched Canvas)
 */

require('dotenv').config({ path: '.env.local' });

const PRINTIFY_API_URL = 'https://api.printify.com/v1';

async function findStretchedCanvasVariants() {
  console.log('🔍 FINDING VARIANTS FOR BLUEPRINT 1159 - MATTE CANVAS, STRETCHED, 1.25"\n');

  if (!process.env.PRINTIFY_API_TOKEN) {
    console.error('❌ PRINTIFY_API_TOKEN not configured');
    process.exit(1);
  }

  try {
    const blueprintId = 1159;
    
    // First, get the blueprint details to see available print providers
    console.log(`📋 Fetching blueprint ${blueprintId} details...`);
    
    const blueprintResponse = await fetch(`${PRINTIFY_API_URL}/catalog/blueprints/${blueprintId}.json`, {
      headers: {
        "Authorization": `Bearer ${process.env.PRINTIFY_API_TOKEN}`,
        "Content-Type": "application/json"
      }
    });

    if (!blueprintResponse.ok) {
      const errorText = await blueprintResponse.text();
      console.error(`❌ Blueprint API Error: ${blueprintResponse.status} - ${errorText}`);
      process.exit(1);
    }

    const blueprintData = await blueprintResponse.json();
    console.log(`✅ Blueprint: ${blueprintData.title}`);
    console.log(`   Brand: ${blueprintData.brand}`);

    // Get print providers
    const providersResponse = await fetch(`${PRINTIFY_API_URL}/catalog/blueprints/${blueprintId}/print_providers.json`, {
      headers: {
        "Authorization": `Bearer ${process.env.PRINTIFY_API_TOKEN}`,
        "Content-Type": "application/json"
      }
    });

    if (!providersResponse.ok) {
      const errorText = await providersResponse.text();
      console.error(`❌ Providers API Error: ${providersResponse.status} - ${errorText}`);
      process.exit(1);
    }

    const providersData = await providersResponse.json();
    console.log(`\n🏭 Found ${providersData.length} print providers:`);
    
    providersData.forEach((provider, index) => {
      console.log(`   ${index + 1}. ID: ${provider.id} - ${provider.title}`);
    });

    // Check variants for each provider
    for (const provider of providersData) {
      console.log(`\n🔍 Checking variants for provider ${provider.id} (${provider.title}):`);
      
      try {
        const variantsResponse = await fetch(`${PRINTIFY_API_URL}/catalog/blueprints/${blueprintId}/print_providers/${provider.id}/variants.json`, {
          headers: {
            "Authorization": `Bearer ${process.env.PRINTIFY_API_TOKEN}`,
            "Content-Type": "application/json"
          }
        });

        if (!variantsResponse.ok) {
          console.log(`   ❌ No variants available for provider ${provider.id}`);
          continue;
        }

        const variantsData = await variantsResponse.json();
        console.log(`   ✅ Found ${variantsData.variants?.length || 0} variants`);

        if (variantsData.variants && variantsData.variants.length > 0) {
          const targetSizes = ['12x18', '16x24', '20x30'];
          const matches = [];
          
          console.log(`\n   🎯 Searching for target sizes: ${targetSizes.join(', ')}`);
          
          targetSizes.forEach(targetSize => {
            console.log(`\n   🔍 Looking for ${targetSize}:`);
            
            // Different patterns to match
            const patterns = [
              new RegExp(`${targetSize.replace('x', '\\s*[x×]\\s*')}`, 'i'),
              new RegExp(`${targetSize.replace('x', '″\\s*[×x]\\s*')}″`, 'i'),
              new RegExp(`${targetSize.replace('x', '"\\s*[×x]\\s*')}"`, 'i'),
              new RegExp(`${targetSize.replace('x', '\\s*×\\s*')}`, 'i')
            ];

            const sizeMatches = variantsData.variants.filter(variant => {
              return patterns.some(pattern => pattern.test(variant.title));
            });

            if (sizeMatches.length > 0) {
              console.log(`      ✅ Found ${sizeMatches.length} matches:`);
              sizeMatches.forEach((match, index) => {
                console.log(`         ${index + 1}. ID: ${match.id} - ${match.title} - $${(match.price / 100).toFixed(2)}`);
                if (match.options) {
                  Object.entries(match.options).forEach(([key, value]) => {
                    console.log(`            ${key}: ${value}`);
                  });
                }
              });
              
              // Take the first match for this size
              if (sizeMatches[0]) {
                matches.push({ targetSize, variant: sizeMatches[0] });
              }
            } else {
              console.log(`      ❌ No exact matches found`);
              
              // Show similar sizes
              const [w, h] = targetSize.split('x').map(Number);
              const similar = variantsData.variants.filter(variant => {
                const sizeMatch = variant.title.match(/(\d+)[\s″"]*[×x]\s*(\d+)[\s″"]*/i);
                if (sizeMatch) {
                  const [, vw, vh] = sizeMatch.map(Number);
                  const diff = Math.abs(vw - w) + Math.abs(vh - h);
                  return diff <= 4; // Within 4 inches total difference
                }
                return false;
              });
              
              if (similar.length > 0) {
                console.log(`      📏 Similar sizes found:`);
                similar.slice(0, 3).forEach((variant, index) => {
                  console.log(`         ${index + 1}. ID: ${variant.id} - ${variant.title} - $${(variant.price / 100).toFixed(2)}`);
                });
              }
            }
          });

          if (matches.length > 0) {
            console.log(`\n   🔧 CONFIGURATION FOR PROVIDER ${provider.id} (${provider.title}):`);
            console.log(`   [ProductType.CANVAS_STRETCHED]: {`);
            console.log(`     GLOBAL: {`);
            console.log(`       blueprint_id: ${blueprintId},`);
            console.log(`       print_provider_id: ${provider.id}, // ${provider.title}`);
            console.log(`       variants: [`);
            matches.forEach((match, index) => {
              const comma = index < matches.length - 1 ? ',' : '';
              console.log(`         { id: ${match.variant.id}, size: '${match.targetSize}', price: ${match.variant.price} }${comma} // $${(match.variant.price / 100).toFixed(2)} - ${match.variant.title}`);
            });
            console.log(`       ]`);
            console.log(`     }`);
            console.log(`   }`);

            // If we found all 3 sizes, we can stop here
            if (matches.length === 3) {
              console.log(`\n🎉 COMPLETE MATCH! Found all 3 target sizes with provider ${provider.id}`);
              
              console.log(`\n📋 UPDATE PRODUCT_A.md WITH:`);
              console.log(`- **Print Provider ID**: ${provider.id} (${provider.title})`);
              console.log(`\n**Available Sizes & Pricing:**`);
              console.log(`| Size | Variant ID | Price (CAD) | Description | Frame Upgrade |`);
              console.log(`|------|------------|-------------|-------------|---------------|`);
              matches.forEach(match => {
                console.log(`| ${match.targetSize} | ${match.variant.id} | $${(match.variant.price / 100).toFixed(2)} | ${match.targetSize.replace('x', '″ × ')}″ Portrait | +$40.00 CAD |`);
              });
              
              return true;
            }
          }
        }
      } catch (error) {
        console.log(`   ❌ Error fetching variants for provider ${provider.id}: ${error.message}`);
      }
    }

    return false;

  } catch (error) {
    console.error('💥 Error:', error);
    process.exit(1);
  }
}

// Run the script
findStretchedCanvasVariants()
  .then((success) => {
    if (success) {
      console.log('\n✅ Successfully found all variant IDs for stretched canvas!');
    } else {
      console.log('\n⚠️  Could not find all target sizes. Check the output above for available options.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('💥 Script crashed:', error);
    process.exit(1);
  });
