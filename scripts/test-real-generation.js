// Test real image generation with actual files
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
require('dotenv').config({ path: '.env.local' });

async function testRealGeneration() {
  try {
    console.log('🧪 Testing real image generation flow...');
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    // Step 1: Create artwork record
    console.log('📝 Step 1: Creating artwork record...');
    const createResponse = await fetch(`${baseUrl}/api/artwork/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Test User',
        customer_email: 'pawpopart@gmail.com'
      })
    });
    
    if (!createResponse.ok) {
      throw new Error(`Failed to create artwork: ${createResponse.statusText}`);
    }
    
    const { artwork, access_token } = await createResponse.json();
    console.log('✅ Artwork created:', artwork.id);
    
    // Step 2: Test with real images
    console.log('🎨 Step 2: Starting real image generation...');
    
    const userImagePath = path.join(__dirname, '../public/images/test headshots/Screenshot_2.jpg');
    const petImagePath = path.join(__dirname, '../public/images/flux-test.png');
    
    if (!fs.existsSync(userImagePath) || !fs.existsSync(petImagePath)) {
      throw new Error('Test images not found');
    }
    
    const formData = new FormData();
    formData.append('userImage', fs.createReadStream(userImagePath));
    formData.append('petImage', fs.createReadStream(petImagePath));
    formData.append('artworkId', artwork.id);
    
    console.log('🚀 Sending generation request...');
    const generateResponse = await fetch(`${baseUrl}/api/monalisa-complete`, {
      method: 'POST',
      body: formData
    });
    
    if (!generateResponse.ok) {
      const errorText = await generateResponse.text();
      console.error('Generation failed:', errorText);
      throw new Error(`Generation failed: ${generateResponse.statusText}`);
    }
    
    const result = await generateResponse.json();
    console.log('✅ Generation completed!');
    console.log('🖼️ Final image:', result.generatedImageUrl);
    console.log('🎨 Mona Lisa base:', result.monaLisaPortraitUrl);
    
    return artwork.id;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  }
}

async function checkFinalStatus(artworkId) {
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  console.log('🔍 Checking final artwork status...');
  
  // Wait a bit for async updates to complete
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const { data, error } = await supabase
    .from('artworks')
    .select('*')
    .eq('id', artworkId)
    .single();
  
  if (error) {
    console.error('Error checking status:', error);
    return;
  }
  
  console.log('📊 Final Artwork Status:');
  console.log('Generation Step:', data.generation_step);
  console.log('Source Images:');
  console.log('  Pet Mom Photo:', data.source_images?.pet_mom_photo || 'empty');
  console.log('  Pet Photo:', data.source_images?.pet_photo || 'empty');
  console.log('Generated Images:');
  console.log('  Mona Lisa Base:', data.generated_images?.monalisa_base || 'empty');
  console.log('  Artwork Preview:', data.generated_images?.artwork_preview || 'empty');
  
  // Check if fields are properly populated
  const hasSourceImages = data.source_images?.pet_mom_photo && data.source_images?.pet_photo;
  const hasMonaLisaBase = data.generated_images?.monalisa_base;
  const hasArtworkPreview = data.generated_images?.artwork_preview;
  
  console.log('\n✅ Validation Results:');
  console.log('Source Images Populated:', hasSourceImages ? '✅' : '❌');
  console.log('Mona Lisa Base Populated:', hasMonaLisaBase ? '✅' : '❌');
  console.log('Artwork Preview Populated:', hasArtworkPreview ? '✅' : '❌');
  console.log('Generation Step Completed:', data.generation_step === 'completed' ? '✅' : '❌');
}

async function runRealTest() {
  try {
    const artworkId = await testRealGeneration();
    await checkFinalStatus(artworkId);
  } catch (error) {
    console.error('Real test failed:', error);
    process.exit(1);
  }
}

runRealTest();
