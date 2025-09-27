#!/usr/bin/env node

/**
 * Get blueprint information and available print providers
 */

require('dotenv').config({ path: '.env.local' });

const PRINTIFY_API_URL = 'https://api.printify.com/v1';

async function getBlueprintInfo() {
  console.log('🔍 FETCHING BLUEPRINT INFORMATION\n');

  if (!process.env.PRINTIFY_API_TOKEN) {
    console.error('❌ PRINTIFY_API_TOKEN not configured');
    process.exit(1);
  }

  try {
    // First, let's get the blueprint details
    const blueprintId = 944;
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
    console.log('✅ Blueprint Details:');
    console.log(`   Title: ${blueprintData.title}`);
    console.log(`   Description: ${blueprintData.description}`);
    console.log(`   Brand: ${blueprintData.brand}`);

    // Get available print providers
    console.log('\n🏭 Available Print Providers:');
    if (blueprintData.print_providers && Array.isArray(blueprintData.print_providers)) {
      blueprintData.print_providers.forEach((provider, index) => {
        console.log(`   ${index + 1}. ID: ${provider.id} - ${provider.title}`);
      });

      // Try each print provider to find variants
      for (const provider of blueprintData.print_providers) {
        console.log(`\n🔍 Checking variants for Print Provider ${provider.id} (${provider.title}):`);
        
        try {
          const variantsResponse = await fetch(`${PRINTIFY_API_URL}/catalog/blueprints/${blueprintId}/print_providers/${provider.id}/variants.json`, {
            headers: {
              "Authorization": `Bearer ${process.env.PRINTIFY_API_TOKEN}`,
              "Content-Type": "application/json"
            }
          });

          if (variantsResponse.ok) {
            const variantsData = await variantsResponse.json();
            console.log(`   ✅ Found ${variantsData.variants?.length || 0} variants`);
            
            if (variantsData.variants && Array.isArray(variantsData.variants)) {
              // Look for our target sizes
              const targetSizes = ['12x18', '16x24', '20x30'];
              const foundVariants = [];

              variantsData.variants.forEach((variant, index) => {
                const title = variant.title || '';
                const hasTargetSize = targetSizes.some(size => 
                  title.includes(size) || 
                  title.includes(size.replace('x', '″ × ') + '″') ||
                  (variant.options && Object.values(variant.options).some(opt => 
                    typeof opt === 'string' && opt.includes(size)
                  ))
                );

                if (hasTargetSize || index < 10) { // Show first 10 or matching variants
                  console.log(`      ${index + 1}. ID: ${variant.id} - ${title} - $${(variant.price / 100).toFixed(2)}`);
                  if (variant.options) {
                    Object.entries(variant.options).forEach(([key, value]) => {
                      console.log(`         ${key}: ${value}`);
                    });
                  }
                  
                  if (hasTargetSize) {
                    foundVariants.push({
                      id: variant.id,
                      title: title,
                      price: variant.price,
                      size: targetSizes.find(size => title.includes(size)) || 'unknown'
                    });
                  }
                }
              });

              if (foundVariants.length > 0) {
                console.log(`\n🎯 RECOMMENDED VARIANTS FOR PRINT PROVIDER ${provider.id}:`);
                foundVariants.forEach(variant => {
                  console.log(`   ${variant.size}: ID ${variant.id} - ${variant.title} - $${(variant.price / 100).toFixed(2)}`);
                });

                // Generate configuration
                console.log(`\n🔧 CONFIGURATION FOR PRINT PROVIDER ${provider.id}:`);
                console.log('[ProductType.CANVAS_FRAMED]: {');
                console.log('  GLOBAL: {');
                console.log(`    blueprint_id: ${blueprintId},`);
                console.log(`    print_provider_id: ${provider.id}, // ${provider.title}`);
                console.log('    variants: [');
                foundVariants.forEach((variant, index) => {
                  const comma = index < foundVariants.length - 1 ? ',' : '';
                  console.log(`      { id: ${variant.id}, size: '${variant.size}', price: ${variant.price} }${comma} // $${(variant.price / 100).toFixed(2)} - ${variant.title}`);
                });
                console.log('    ]');
                console.log('  }');
                console.log('}');
              }
            }
          } else {
            console.log(`   ❌ No variants available for provider ${provider.id}`);
          }
        } catch (error) {
          console.log(`   ❌ Error fetching variants for provider ${provider.id}: ${error.message}`);
        }
      }
    } else {
      console.log('   No print providers found');
    }

  } catch (error) {
    console.error('💥 Error:', error);
    process.exit(1);
  }
}

// Run the script
getBlueprintInfo();
