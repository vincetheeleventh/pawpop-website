#!/usr/bin/env node

/**
 * Try different approaches to get print providers for blueprint 944
 */

require('dotenv').config({ path: '.env.local' });

const PRINTIFY_API_URL = 'https://api.printify.com/v1';

async function checkPrintProvidersSeparately() {
  console.log('🔍 CHECKING PRINT PROVIDERS FOR BLUEPRINT 944 - DIFFERENT APPROACHES\n');

  if (!process.env.PRINTIFY_API_TOKEN) {
    console.error('❌ PRINTIFY_API_TOKEN not configured');
    process.exit(1);
  }

  const blueprintId = 944;

  try {
    // Approach 1: Try the print providers endpoint directly
    console.log('1️⃣ TRYING PRINT PROVIDERS ENDPOINT DIRECTLY');
    console.log('=' .repeat(60));
    
    try {
      const providersResponse = await fetch(`${PRINTIFY_API_URL}/catalog/blueprints/${blueprintId}/print_providers.json`, {
        headers: {
          "Authorization": `Bearer ${process.env.PRINTIFY_API_TOKEN}`,
          "Content-Type": "application/json"
        }
      });

      console.log(`Response Status: ${providersResponse.status}`);
      
      if (providersResponse.ok) {
        const providersData = await providersResponse.json();
        console.log('✅ Print providers response:');
        console.log(JSON.stringify(providersData, null, 2));
        
        if (Array.isArray(providersData) && providersData.length > 0) {
          console.log(`\n🏭 Found ${providersData.length} print providers:`);
          providersData.forEach((provider, index) => {
            console.log(`   ${index + 1}. ID: ${provider.id} - ${provider.title}`);
          });
          
          // Try variants for first provider
          const firstProvider = providersData[0];
          console.log(`\n🔍 Checking variants for provider ${firstProvider.id}:`);
          
          const variantsResponse = await fetch(`${PRINTIFY_API_URL}/catalog/blueprints/${blueprintId}/print_providers/${firstProvider.id}/variants.json`, {
            headers: {
              "Authorization": `Bearer ${process.env.PRINTIFY_API_TOKEN}`,
              "Content-Type": "application/json"
            }
          });
          
          if (variantsResponse.ok) {
            const variantsData = await variantsResponse.json();
            console.log(`✅ Found ${variantsData.variants?.length || 0} variants`);
            
            if (variantsData.variants && variantsData.variants.length > 0) {
              // Look for our target sizes
              const targetSizes = ['12x18', '16x24', '20x30'];
              const matches = [];
              
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
                  matches.push({ size, variant });
                  console.log(`   ✅ ${size}: ID ${variant.id} - ${variant.title} - $${(variant.price / 100).toFixed(2)}`);
                } else {
                  console.log(`   ❌ ${size}: Not found`);
                }
              });
              
              if (matches.length > 0) {
                console.log(`\n🔧 CONFIGURATION UPDATE NEEDED:`);
                console.log(`Blueprint ID: ${blueprintId}`);
                console.log(`Print Provider ID: ${firstProvider.id}`);
                console.log(`Variants:`);
                matches.forEach(match => {
                  console.log(`  { id: ${match.variant.id}, size: '${match.size}', price: ${match.variant.price} }, // $${(match.variant.price / 100).toFixed(2)}`);
                });
              }
            }
          }
        }
      } else {
        const errorText = await providersResponse.text();
        console.log(`❌ Error: ${providersResponse.status} - ${errorText}`);
      }
    } catch (error) {
      console.log(`❌ Error with direct approach: ${error.message}`);
    }

    // Approach 2: Try some common print provider IDs
    console.log('\n2️⃣ TRYING COMMON PRINT PROVIDER IDS');
    console.log('=' .repeat(60));
    
    const commonProviderIds = [1, 2, 3, 4, 5, 10, 15, 20, 25, 30];
    
    for (const providerId of commonProviderIds) {
      try {
        const variantsResponse = await fetch(`${PRINTIFY_API_URL}/catalog/blueprints/${blueprintId}/print_providers/${providerId}/variants.json`, {
          headers: {
            "Authorization": `Bearer ${process.env.PRINTIFY_API_TOKEN}`,
            "Content-Type": "application/json"
          }
        });
        
        if (variantsResponse.ok) {
          const variantsData = await variantsResponse.json();
          console.log(`✅ Provider ${providerId}: Found ${variantsData.variants?.length || 0} variants`);
          
          if (variantsData.variants && variantsData.variants.length > 0) {
            // Show first few variants
            console.log(`   First 3 variants:`);
            variantsData.variants.slice(0, 3).forEach((variant, index) => {
              console.log(`      ${index + 1}. ID: ${variant.id} - ${variant.title} - $${(variant.price / 100).toFixed(2)}`);
            });
            
            // Check for our sizes
            const targetSizes = ['12x18', '16x24', '20x30'];
            const matches = targetSizes.filter(size => 
              variantsData.variants.some(v => 
                v.title && (
                  v.title.includes(size) || 
                  v.title.includes(size.replace('x', '″ × ') + '″')
                )
              )
            );
            
            if (matches.length > 0) {
              console.log(`   🎯 Found matching sizes: ${matches.join(', ')}`);
              
              if (matches.length >= 2) {
                console.log(`\n   🔧 POTENTIAL CONFIGURATION:`);
                console.log(`   Blueprint ID: ${blueprintId}, Provider ID: ${providerId}`);
                
                matches.forEach(size => {
                  const variant = variantsData.variants.find(v => 
                    v.title && v.title.includes(size)
                  );
                  if (variant) {
                    console.log(`     { id: ${variant.id}, size: '${size}', price: ${variant.price} }, // $${(variant.price / 100).toFixed(2)}`);
                  }
                });
              }
            }
          }
          break; // Found a working provider, stop searching
        }
      } catch (error) {
        // Silently continue to next provider
      }
    }

  } catch (error) {
    console.error('💥 Error:', error);
    process.exit(1);
  }
}

// Run the script
checkPrintProvidersSeparately();
