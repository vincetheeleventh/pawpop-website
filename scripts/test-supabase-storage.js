// Test Supabase Storage integration for artwork images
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Inline implementation for testing
async function storeFalImageInSupabase(falImageUrl, artworkId, step) {
  const fileName = `${artworkId}/${step}_${Date.now()}.jpg`;
  
  // Download image from fal.ai
  console.log(`📥 Downloading image from fal.ai: ${falImageUrl}`);
  const response = await fetch(falImageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }
  
  const imageBuffer = await response.arrayBuffer();
  const contentType = response.headers.get('content-type') || 'image/jpeg';
  
  // Upload to Supabase Storage
  console.log(`☁️ Uploading to Supabase Storage: ${fileName}`);
  const { data, error } = await supabase.storage
    .from('artwork-images')
    .upload(fileName, imageBuffer, {
      contentType,
      upsert: true
    });

  if (error) {
    throw new Error(`Supabase storage upload failed: ${error.message}`);
  }

  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from('artwork-images')
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
}

async function testSupabaseStorage() {
  try {
    console.log('🧪 Testing Supabase Storage integration...');

    // Test with a sample fal.ai image URL (using a placeholder)
    const testFalUrl = 'https://fal.media/files/rabbit/dHrFcrapu6KT3KOlbue8k_bb5f501b562245dd90f7247d1f7a955a.jpg';
    const testArtworkId = 'test-artwork-123';
    const testStep = 'monalisa_base';

    console.log(`📥 Testing storage of: ${testFalUrl}`);
    console.log(`🆔 Artwork ID: ${testArtworkId}`);
    console.log(`📋 Step: ${testStep}`);

    const supabaseUrl = await storeFalImageInSupabase(testFalUrl, testArtworkId, testStep);
    
    console.log('✅ Image successfully stored in Supabase!');
    console.log(`🔗 Supabase URL: ${supabaseUrl}`);

    // Test if the image is accessible
    console.log('🔍 Testing image accessibility...');
    const response = await fetch(supabaseUrl);
    if (response.ok) {
      console.log('✅ Image is publicly accessible');
      console.log(`📊 Content-Type: ${response.headers.get('content-type')}`);
      console.log(`📏 Content-Length: ${response.headers.get('content-length')} bytes`);
    } else {
      console.error('❌ Image is not accessible:', response.statusText);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testSupabaseStorage();
