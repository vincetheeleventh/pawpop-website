#!/usr/bin/env node

/**
 * Debug blueprint 944 specifically - it should have print providers
 */

require('dotenv').config({ path: '.env.local' });

const PRINTIFY_API_URL = 'https://api.printify.com/v1';

async function debugBlueprint944() {
  console.log('🔍 DEBUGGING BLUEPRINT 944 - MATTE CANVAS, FRAMED\n');

  if (!process.env.PRINTIFY_API_TOKEN) {
    console.error('❌ PRINTIFY_API_TOKEN not configured');
    process.exit(1);
  }

  try {
    const blueprintId = 944;
    console.log(`📋 Fetching blueprint ${blueprintId} details...`);

    const response = await fetch(`${PRINTIFY_API_URL}/catalog/blueprints/${blueprintId}.json`, {
      headers: {
        "Authorization": `Bearer ${process.env.PRINTIFY_API_TOKEN}`,
        "Content-Type": "application/json"
      }
    });

    console.log(`Response Status: ${response.status}`);
    console.log(`Response Headers:`, Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error: ${response.status} - ${errorText}`);
      process.exit(1);
    }

    const data = await response.json();
    console.log('\n📄 FULL RESPONSE:');
    console.log(JSON.stringify(data, null, 2));

    console.log('\n📋 BLUEPRINT DETAILS:');
    console.log(`   ID: ${data.id}`);
    console.log(`   Title: ${data.title}`);
    console.log(`   Brand: ${data.brand}`);
    console.log(`   Description: ${data.description?.substring(0, 200)}...`);

    console.log('\n🏭 PRINT PROVIDERS:');
    if (data.print_providers) {
      console.log(`   Type: ${typeof data.print_providers}`);
      console.log(`   Is Array: ${Array.isArray(data.print_providers)}`);
      console.log(`   Length: ${data.print_providers.length}`);
      
      if (Array.isArray(data.print_providers) && data.print_providers.length > 0) {
        data.print_providers.forEach((provider, index) => {
          console.log(`   ${index + 1}. Provider ID: ${provider.id}`);
          console.log(`      Title: ${provider.title}`);
          console.log(`      Location: ${provider.location}`);
          console.log(`      ---`);
        });

        // Try to get variants for the first provider
        const firstProvider = data.print_providers[0];
        console.log(`\n🔍 Checking variants for provider ${firstProvider.id} (${firstProvider.title}):`);
        
        try {
          const variantsResponse = await fetch(`${PRINTIFY_API_URL}/catalog/blueprints/${blueprintId}/print_providers/${firstProvider.id}/variants.json`, {
            headers: {
              "Authorization": `Bearer ${process.env.PRINTIFY_API_TOKEN}`,
              "Content-Type": "application/json"
            }
          });

          console.log(`Variants Response Status: ${variantsResponse.status}`);

          if (variantsResponse.ok) {
            const variantsData = await variantsResponse.json();
            console.log(`✅ Found ${variantsData.variants?.length || 0} variants`);
            
            if (variantsData.variants && variantsData.variants.length > 0) {
              console.log('\n📊 FIRST 10 VARIANTS:');
              variantsData.variants.slice(0, 10).forEach((variant, index) => {
                console.log(`   ${index + 1}. ID: ${variant.id}`);
                console.log(`      Title: ${variant.title}`);
                console.log(`      Price: $${(variant.price / 100).toFixed(2)}`);
                if (variant.options) {
                  console.log(`      Options:`, variant.options);
                }
                console.log(`      ---`);
              });

              // Look for our target sizes
              const targetSizes = ['12x18', '16x24', '20x30'];
              console.log(`\n🎯 SEARCHING FOR TARGET SIZES: ${targetSizes.join(', ')}`);
              
              targetSizes.forEach(size => {
                const variants = variantsData.variants.filter(v => 
                  v.title && (
                    v.title.includes(size) || 
                    v.title.includes(size.replace('x', '″ × ') + '″') ||
                    v.title.includes(size.replace('x', '" × ') + '"') ||
                    v.title.includes(size.replace('x', ' × '))
                  )
                );
                
                console.log(`\n   ${size}:`);
                if (variants.length > 0) {
                  variants.forEach(variant => {
                    console.log(`      ✅ ID: ${variant.id} - ${variant.title} - $${(variant.price / 100).toFixed(2)}`);
                  });
                } else {
                  console.log(`      ❌ No variants found`);
                }
              });

              // Generate configuration if we found matches
              const allMatches = [];
              targetSizes.forEach(size => {
                const variant = variantsData.variants.find(v => 
                  v.title && (
                    v.title.includes(size) || 
                    v.title.includes(size.replace('x', '″ × ') + '″') ||
                    v.title.includes(size.replace('x', '" × ') + '"') ||
                    v.title.includes(size.replace('x', ' × '))
                  )
                );
                if (variant) {
                  allMatches.push({ size, variant });
                }
              });

              if (allMatches.length > 0) {
                console.log(`\n🔧 CONFIGURATION FOR PRINTIFY.TS:`);
                console.log(`[ProductType.CANVAS_FRAMED]: {`);
                console.log(`  GLOBAL: {`);
                console.log(`    blueprint_id: ${blueprintId},`);
                console.log(`    print_provider_id: ${firstProvider.id}, // ${firstProvider.title}`);
                console.log(`    variants: [`);
                allMatches.forEach((match, index) => {
                  const comma = index < allMatches.length - 1 ? ',' : '';
                  console.log(`      { id: ${match.variant.id}, size: '${match.size}', price: ${match.variant.price} }${comma} // $${(match.variant.price / 100).toFixed(2)} - ${match.variant.title}`);
                });
                console.log(`    ]`);
                console.log(`  }`);
                console.log(`}`);
              }
            }
          } else {
            const errorText = await variantsResponse.text();
            console.error(`❌ Variants API Error: ${variantsResponse.status} - ${errorText}`);
          }
        } catch (variantError) {
          console.error(`❌ Error fetching variants: ${variantError.message}`);
        }
      } else {
        console.log('   ❌ No print providers found or invalid format');
      }
    } else {
      console.log('   ❌ print_providers field not found in response');
    }

  } catch (error) {
    console.error('💥 Error:', error);
    process.exit(1);
  }
}

// Run the script
debugBlueprint944();
