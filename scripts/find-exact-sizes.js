#!/usr/bin/env node

/**
 * Find exact variant IDs for 12x18, 16x24, 20x30 in blueprint 944
 */

require('dotenv').config({ path: '.env.local' });

const PRINTIFY_API_URL = 'https://api.printify.com/v1';

async function findExactSizes() {
  console.log('🔍 FINDING EXACT SIZES: 12x18, 16x24, 20x30\n');

  if (!process.env.PRINTIFY_API_TOKEN) {
    console.error('❌ PRINTIFY_API_TOKEN not configured');
    process.exit(1);
  }

  try {
    const blueprintId = 944;
    const providerId = 105; // Jondo

    const variantsResponse = await fetch(`${PRINTIFY_API_URL}/catalog/blueprints/${blueprintId}/print_providers/${providerId}/variants.json`, {
      headers: {
        "Authorization": `Bearer ${process.env.PRINTIFY_API_TOKEN}`,
        "Content-Type": "application/json"
      }
    });

    if (!variantsResponse.ok) {
      const errorText = await variantsResponse.text();
      console.error(`❌ API Error: ${variantsResponse.status} - ${errorText}`);
      process.exit(1);
    }

    const variantsData = await variantsResponse.json();
    console.log(`✅ Found ${variantsData.variants?.length || 0} total variants\n`);

    if (variantsData.variants && variantsData.variants.length > 0) {
      const targetSizes = ['12x18', '16x24', '20x30'];
      
      console.log('🎯 SEARCHING FOR EXACT MATCHES:');
      console.log('=' .repeat(60));

      targetSizes.forEach(targetSize => {
        console.log(`\n🔍 Looking for ${targetSize}:`);
        
        // Different patterns to match
        const patterns = [
          new RegExp(`${targetSize.replace('x', '\\s*[x×]\\s*')}`, 'i'),
          new RegExp(`${targetSize.replace('x', '″\\s*[×x]\\s*')}″`, 'i'),
          new RegExp(`${targetSize.replace('x', '"\\s*[×x]\\s*')}"`, 'i'),
          new RegExp(`${targetSize.replace('x', '\\s*×\\s*')}`, 'i')
        ];

        const matches = variantsData.variants.filter(variant => {
          return patterns.some(pattern => pattern.test(variant.title));
        });

        if (matches.length > 0) {
          console.log(`   ✅ Found ${matches.length} matches:`);
          matches.forEach((match, index) => {
            console.log(`      ${index + 1}. ID: ${match.id} - ${match.title} - $${(match.price / 100).toFixed(2)}`);
            if (match.options) {
              Object.entries(match.options).forEach(([key, value]) => {
                console.log(`         ${key}: ${value}`);
              });
            }
          });
        } else {
          console.log(`   ❌ No exact matches found`);
          
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
            console.log(`   📏 Similar sizes found:`);
            similar.slice(0, 3).forEach((variant, index) => {
              console.log(`      ${index + 1}. ID: ${variant.id} - ${variant.title} - $${(variant.price / 100).toFixed(2)}`);
            });
          }
        }
      });

      // Generate configuration for exact matches
      const exactMatches = [];
      targetSizes.forEach(targetSize => {
        const patterns = [
          new RegExp(`${targetSize.replace('x', '\\s*[x×]\\s*')}`, 'i'),
          new RegExp(`${targetSize.replace('x', '″\\s*[×x]\\s*')}″`, 'i'),
          new RegExp(`${targetSize.replace('x', '"\\s*[×x]\\s*')}"`, 'i')
        ];

        const match = variantsData.variants.find(variant => {
          return patterns.some(pattern => pattern.test(variant.title));
        });

        if (match) {
          exactMatches.push({ targetSize, variant: match });
        }
      });

      if (exactMatches.length > 0) {
        console.log(`\n🔧 EXACT MATCHES CONFIGURATION:`);
        console.log('=' .repeat(60));
        console.log(`[ProductType.CANVAS_FRAMED]: {`);
        console.log(`  GLOBAL: {`);
        console.log(`    blueprint_id: ${blueprintId},`);
        console.log(`    print_provider_id: ${providerId}, // Jondo`);
        console.log(`    variants: [`);
        exactMatches.forEach((match, index) => {
          const comma = index < exactMatches.length - 1 ? ',' : '';
          console.log(`      { id: ${match.variant.id}, size: '${match.targetSize}', price: ${match.variant.price} }${comma} // $${(match.variant.price / 100).toFixed(2)} - ${match.variant.title}`);
        });
        console.log(`    ]`);
        console.log(`  }`);
        console.log(`}`);
      }

      // Also show all variants that contain our target dimensions
      console.log(`\n📋 ALL VARIANTS CONTAINING TARGET DIMENSIONS:`);
      console.log('=' .repeat(60));
      
      targetSizes.forEach(targetSize => {
        const [w, h] = targetSize.split('x');
        console.log(`\n${targetSize} (${w}" x ${h}"):`);
        
        const containing = variantsData.variants.filter(variant => 
          variant.title.includes(w) && variant.title.includes(h)
        );
        
        if (containing.length > 0) {
          containing.forEach((variant, index) => {
            console.log(`   ${index + 1}. ID: ${variant.id} - ${variant.title}`);
          });
        } else {
          console.log(`   No variants found containing both ${w} and ${h}`);
        }
      });
    }

  } catch (error) {
    console.error('💥 Error:', error);
    process.exit(1);
  }
}

// Run the script
findExactSizes();
