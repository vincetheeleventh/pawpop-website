#!/usr/bin/env node

/**
 * Fetch real variant IDs from Printify API for framed canvas blueprint
 */

require('dotenv').config({ path: '.env.local' });

const PRINTIFY_API_URL = 'https://api.printify.com/v1';

async function getPrintifyVariants() {
  console.log('🔍 FETCHING PRINTIFY VARIANT IDS FOR FRAMED CANVAS\n');

  if (!process.env.PRINTIFY_API_TOKEN) {
    console.error('❌ PRINTIFY_API_TOKEN not configured');
    process.exit(1);
  }

  try {
    // Blueprint ID for Matte Canvas, Framed Multi-color
    const blueprintId = 944;
    const printProviderId = 1; // Generic Brand

    console.log(`📋 Blueprint ID: ${blueprintId}`);
    console.log(`🏭 Print Provider ID: ${printProviderId}`);

    // Fetch blueprint details
    const response = await fetch(`${PRINTIFY_API_URL}/catalog/blueprints/${blueprintId}/print_providers/${printProviderId}/variants.json`, {
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
    console.log('\n📊 AVAILABLE VARIANTS:');
    console.log('=' .repeat(60));

    if (data.variants && Array.isArray(data.variants)) {
      data.variants.forEach((variant, index) => {
        console.log(`${index + 1}. ID: ${variant.id}`);
        console.log(`   Title: ${variant.title}`);
        console.log(`   Price: $${(variant.price / 100).toFixed(2)}`);
        if (variant.options) {
          Object.entries(variant.options).forEach(([key, value]) => {
            console.log(`   ${key}: ${value}`);
          });
        }
        console.log('   ---');
      });

      // Find variants that look like our sizes
      console.log('\n🎯 RECOMMENDED VARIANTS FOR FRAMED CANVAS:');
      console.log('=' .repeat(60));

      const targetSizes = ['12x18', '16x24', '20x30'];
      const recommendedVariants = [];

      targetSizes.forEach(size => {
        const variant = data.variants.find(v => 
          v.title && (
            v.title.includes(size) || 
            v.title.includes(size.replace('x', '″ × ') + '″') ||
            (v.options && Object.values(v.options).some(opt => 
              typeof opt === 'string' && opt.includes(size)
            ))
          )
        );

        if (variant) {
          recommendedVariants.push({
            size: size,
            id: variant.id,
            title: variant.title,
            price: variant.price
          });
          console.log(`✅ ${size}: ID ${variant.id} - ${variant.title} - $${(variant.price / 100).toFixed(2)}`);
        } else {
          console.log(`❌ ${size}: No matching variant found`);
        }
      });

      // Generate updated configuration
      if (recommendedVariants.length > 0) {
        console.log('\n🔧 UPDATED CONFIGURATION:');
        console.log('=' .repeat(60));
        console.log('Replace the CANVAS_FRAMED configuration with:');
        console.log('');
        console.log('[ProductType.CANVAS_FRAMED]: {');
        console.log('  GLOBAL: {');
        console.log(`    blueprint_id: ${blueprintId},`);
        console.log(`    print_provider_id: ${printProviderId},`);
        console.log('    variants: [');
        
        recommendedVariants.forEach((variant, index) => {
          const comma = index < recommendedVariants.length - 1 ? ',' : '';
          console.log(`      { id: ${variant.id}, size: '${variant.size}', price: ${variant.price} }${comma} // $${(variant.price / 100).toFixed(2)} - ${variant.title}`);
        });
        
        console.log('    ]');
        console.log('  }');
        console.log('}');
      }

    } else {
      console.log('❌ No variants found in response');
      console.log('Response:', JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.error('💥 Error fetching variants:', error);
    process.exit(1);
  }
}

// Run the script
getPrintifyVariants();
