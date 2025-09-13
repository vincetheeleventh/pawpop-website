require('dotenv').config({ path: '.env.local' });

async function debugArtPrintVariants() {
  const PRINTIFY_API_TOKEN = process.env.PRINTIFY_API_TOKEN;
  
  if (!PRINTIFY_API_TOKEN) {
    console.error('❌ PRINTIFY_API_TOKEN not found in .env.local');
    return;
  }

  console.log('🔍 Debugging Art Print Variant Resolution...\n');

  try {
    // Fetch art print variants (Blueprint 1191, Provider 27)
    const response = await fetch('https://api.printify.com/v1/catalog/blueprints/1191/print_providers/27/variants.json', {
      headers: {
        'Authorization': `Bearer ${PRINTIFY_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`📊 Total variants available: ${data.variants?.length || 0}\n`);

    if (data.variants) {
      // Test the filtering logic
      const targetSizes = ['12″ x 18″', '18″ x 24″', '20″ x 30″'];
      
      console.log('🎯 Target sizes:', targetSizes);
      console.log('🔍 Filtering variants...\n');
      
      const filteredVariants = data.variants.filter((v) => 
        targetSizes.some(size => v.title?.includes(size))
      );
      
      console.log(`✅ Filtered variants found: ${filteredVariants.length}`);
      
      filteredVariants.forEach((variant, index) => {
        console.log(`  ${index + 1}. ID: ${variant.id} - Title: "${variant.title}"`);
      });
      
      if (filteredVariants.length === 0) {
        console.log('\n❌ No variants matched the target sizes!');
        console.log('📋 Available variant titles (first 10):');
        data.variants.slice(0, 10).forEach((variant, index) => {
          console.log(`  ${index + 1}. "${variant.title}"`);
        });
      } else {
        console.log('\n🎉 Art print variants should be working!');
        console.log('📝 Variant IDs to use:', filteredVariants.map(v => v.id));
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugArtPrintVariants();
