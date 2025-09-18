// Test script to verify MonaLisa storage fix
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testMonaLisaStorageFix() {
  const baseUrl = 'http://localhost:3001';
  
  console.log('🧪 Testing MonaLisa Storage Fix...\n');
  
  try {
    // Step 1: Create a test artwork
    console.log('1️⃣ Creating test artwork...');
    const createResponse = await fetch(`${baseUrl}/api/artwork/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Test User',
        customer_email: 'test@example.com',
        pet_name: 'Buddy'
      })
    });
    
    if (!createResponse.ok) {
      throw new Error(`Failed to create artwork: ${createResponse.statusText}`);
    }
    
    const artwork = await createResponse.json();
    console.log(`✅ Artwork created: ${artwork.id}`);
    console.log(`🔗 Access token: ${artwork.access_token}\n`);
    
    // Step 2: Test MonaLisa generation with a sample image URL
    console.log('2️⃣ Testing MonaLisa generation...');
    const monaLisaResponse = await fetch(`${baseUrl}/api/monalisa-maker`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageUrl: 'https://images.unsplash.com/photo-1544568100-847a948585b9?w=400',
        artworkId: artwork.id
      })
    });
    
    if (!monaLisaResponse.ok) {
      const errorText = await monaLisaResponse.text();
      console.log(`❌ MonaLisa generation failed: ${monaLisaResponse.status} - ${errorText}`);
      return;
    }
    
    const monaLisaResult = await monaLisaResponse.json();
    console.log('✅ MonaLisa generation successful!');
    console.log(`📸 Supabase URL: ${monaLisaResult.imageUrl}`);
    console.log(`🔗 Fallback URL: ${monaLisaResult.falImageUrl}\n`);
    
    // Step 3: Update artwork with MonaLisa result
    console.log('3️⃣ Updating artwork with MonaLisa result...');
    const updateResponse = await fetch(`${baseUrl}/api/artwork/update`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        artwork_id: artwork.id,
        generated_image_url: monaLisaResult.imageUrl,
        generation_step: 'monalisa_generation'
      })
    });
    
    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.log(`❌ Artwork update failed: ${updateResponse.status} - ${errorText}`);
      return;
    }
    
    console.log('✅ Artwork updated successfully!\n');
    
    // Step 4: Check the artwork status to verify JSONB fields
    console.log('4️⃣ Checking artwork status...');
    const statusResponse = await fetch(`${baseUrl}/api/artwork/status?token=${artwork.access_token}`);
    
    if (!statusResponse.ok) {
      throw new Error(`Failed to get artwork status: ${statusResponse.statusText}`);
    }
    
    const statusResult = await statusResponse.json();
    const artworkData = statusResult.artwork;
    
    console.log('📊 Artwork Status Check:');
    console.log(`- Generation Step: ${artworkData.generation_step}`);
    console.log(`- Generated Images:`, JSON.stringify(artworkData.generated_images, null, 2));
    
    // Verify the fix
    const monaLisaBase = artworkData.generated_images?.monalisa_base;
    if (monaLisaBase && monaLisaBase !== '') {
      console.log('\n🎉 SUCCESS! MonaLisa base URL is properly stored in database');
      console.log(`✅ monalisa_base: ${monaLisaBase}`);
      
      // Check if it's a Supabase Storage URL
      if (monaLisaBase.includes('supabase')) {
        console.log('✅ URL is from Supabase Storage (as expected)');
      } else {
        console.log('⚠️  URL is not from Supabase Storage (fallback URL used)');
      }
    } else {
      console.log('\n❌ FAILED! MonaLisa base URL is still empty in database');
      console.log('❌ The fix did not work as expected');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testMonaLisaStorageFix();
