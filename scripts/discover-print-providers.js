#!/usr/bin/env node

/**
 * Discover available print providers for new blueprint IDs
 */

require('dotenv').config({ path: '.env.local' });

const PRINTIFY_API_URL = 'https://api.printify.com/v1';
const TOKEN = process.env.PRINTIFY_API_TOKEN;

const BLUEPRINTS = {
  1191: 'Photo Art Paper Posters',
  1159: 'Matte Canvas, Stretched, 1.25"',
  944: 'Matte Canvas, Framed Multi-color'
};

async function fetchFromPrintify(endpoint) {
  const response = await fetch(`${PRINTIFY_API_URL}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

async function discoverProviders() {
  console.log('🔍 Discovering print providers for new blueprints...\n');
  
  for (const [blueprintId, name] of Object.entries(BLUEPRINTS)) {
    try {
      console.log(`📋 ${name} (Blueprint ${blueprintId}):`);
      
      const providers = await fetchFromPrintify(`/catalog/blueprints/${blueprintId}/print_providers.json`);
      
      console.log(`  Found ${providers.length} print providers:`);
      
      for (const provider of providers) {
        console.log(`    ID: ${provider.id} - ${provider.title}`);
        
        // Test variants for this provider
        try {
          const variants = await fetchFromPrintify(
            `/catalog/blueprints/${blueprintId}/print_providers/${provider.id}/variants.json`
          );
          console.log(`      ✅ ${variants.variants?.length || 0} variants available`);
          
          // Show first few variants
          if (variants.variants && variants.variants.length > 0) {
            variants.variants.slice(0, 3).forEach((variant, index) => {
              console.log(`        ${index + 1}. ${variant.title} (ID: ${variant.id})`);
            });
          }
        } catch (error) {
          console.log(`      ❌ No variants available`);
        }
      }
      
      console.log('');
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}\n`);
    }
  }
}

discoverProviders().catch(console.error);
