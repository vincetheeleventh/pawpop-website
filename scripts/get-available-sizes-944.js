#!/usr/bin/env node

/**
 * Get all available sizes for blueprint 944 with Jondo provider
 */

require('dotenv').config({ path: '.env.local' });

const PRINTIFY_API_URL = 'https://api.printify.com/v1';

async function getAvailableSizes() {
  console.log('🔍 GETTING ALL AVAILABLE SIZES FOR BLUEPRINT 944 (JONDO)\n');

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
    console.log(`✅ Found ${variantsData.variants?.length || 0} variants\n`);

    if (variantsData.variants && variantsData.variants.length > 0) {
      // Group variants by size patterns
      const sizeGroups = {};
      const sizePatterns = [
        /(\d+)\s*[x×]\s*(\d+)/i,  // 12x18, 12×18
        /(\d+)"\s*[x×]\s*(\d+)"/i, // 12"x18"
        /(\d+)″\s*[×]\s*(\d+)″/i   // 12″×18″
      ];

      variantsData.variants.forEach(variant => {
        let foundSize = null;
        
        for (const pattern of sizePatterns) {
          const match = variant.title.match(pattern);
          if (match) {
            foundSize = `${match[1]}x${match[2]}`;
            break;
          }
        }
        
        if (foundSize) {
          if (!sizeGroups[foundSize]) {
            sizeGroups[foundSize] = [];
          }
          sizeGroups[foundSize].push(variant);
        } else {
          // Ungrouped variants
          if (!sizeGroups['other']) {
            sizeGroups['other'] = [];
          }
          sizeGroups['other'].push(variant);
        }
      });

      console.log('📊 AVAILABLE SIZES:');
      console.log('=' .repeat(80));
      
      Object.keys(sizeGroups).sort().forEach(size => {
        if (size === 'other') return; // Skip other for now
        
        console.log(`\n📐 SIZE: ${size}`);
        sizeGroups[size].forEach((variant, index) => {
          console.log(`   ${index + 1}. ID: ${variant.id} - ${variant.title} - $${(variant.price / 100).toFixed(2)}`);
          if (variant.options) {
            Object.entries(variant.options).forEach(([key, value]) => {
              console.log(`      ${key}: ${value}`);
            });
          }
        });
      });

      // Show some ungrouped variants
      if (sizeGroups['other'] && sizeGroups['other'].length > 0) {
        console.log(`\n❓ OTHER VARIANTS (first 10):`);
        sizeGroups['other'].slice(0, 10).forEach((variant, index) => {
          console.log(`   ${index + 1}. ID: ${variant.id} - ${variant.title} - $${(variant.price / 100).toFixed(2)}`);
        });
      }

      // Find closest matches to our target sizes
      const targetSizes = ['12x18', '16x24', '20x30'];
      console.log(`\n🎯 LOOKING FOR CLOSEST MATCHES TO: ${targetSizes.join(', ')}`);
      console.log('=' .repeat(80));

      const availableSizes = Object.keys(sizeGroups).filter(s => s !== 'other');
      
      targetSizes.forEach(target => {
        console.log(`\n🔍 Target: ${target}`);
        
        // Look for exact match
        const exactMatch = availableSizes.find(size => size === target);
        if (exactMatch) {
          console.log(`   ✅ Exact match found: ${exactMatch}`);
          const variant = sizeGroups[exactMatch][0]; // Take first variant
          console.log(`      Recommended: ID ${variant.id} - ${variant.title} - $${(variant.price / 100).toFixed(2)}`);
          return;
        }
        
        // Look for similar sizes
        const [targetW, targetH] = target.split('x').map(Number);
        const similarSizes = availableSizes.filter(size => {
          const [w, h] = size.split('x').map(Number);
          const ratio = w / h;
          const targetRatio = targetW / targetH;
          return Math.abs(ratio - targetRatio) < 0.1; // Similar aspect ratio
        });
        
        if (similarSizes.length > 0) {
          console.log(`   📏 Similar sizes found: ${similarSizes.join(', ')}`);
          similarSizes.forEach(size => {
            const variant = sizeGroups[size][0];
            console.log(`      Option: ${size} - ID ${variant.id} - ${variant.title} - $${(variant.price / 100).toFixed(2)}`);
          });
        } else {
          console.log(`   ❌ No similar sizes found`);
        }
      });

      // Generate configuration with best available sizes
      const bestMatches = [];
      targetSizes.forEach(target => {
        const exactMatch = availableSizes.find(size => size === target);
        if (exactMatch) {
          bestMatches.push({ target, actual: exactMatch, variant: sizeGroups[exactMatch][0] });
        } else {
          // Find closest size
          const [targetW, targetH] = target.split('x').map(Number);
          let closestSize = null;
          let closestDistance = Infinity;
          
          availableSizes.forEach(size => {
            const [w, h] = size.split('x').map(Number);
            const distance = Math.abs(w - targetW) + Math.abs(h - targetH);
            if (distance < closestDistance) {
              closestDistance = distance;
              closestSize = size;
            }
          });
          
          if (closestSize) {
            bestMatches.push({ target, actual: closestSize, variant: sizeGroups[closestSize][0] });
          }
        }
      });

      if (bestMatches.length > 0) {
        console.log(`\n🔧 RECOMMENDED CONFIGURATION:`);
        console.log('=' .repeat(80));
        console.log(`[ProductType.CANVAS_FRAMED]: {`);
        console.log(`  GLOBAL: {`);
        console.log(`    blueprint_id: ${blueprintId},`);
        console.log(`    print_provider_id: ${providerId}, // Jondo`);
        console.log(`    variants: [`);
        bestMatches.forEach((match, index) => {
          const comma = index < bestMatches.length - 1 ? ',' : '';
          console.log(`      { id: ${match.variant.id}, size: '${match.actual}', price: ${match.variant.price} }${comma} // $${(match.variant.price / 100).toFixed(2)} - ${match.variant.title}`);
        });
        console.log(`    ]`);
        console.log(`  }`);
        console.log(`}`);
      }
    }

  } catch (error) {
    console.error('💥 Error:', error);
    process.exit(1);
  }
}

// Run the script
getAvailableSizes();
