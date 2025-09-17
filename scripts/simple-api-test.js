// Simple test to verify the artwork update API is working
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function simpleApiTest() {
  try {
    console.log('🧪 Simple API test...');
    
    // Create a minimal test artwork
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    const { data: artwork, error: createError } = await supabase
      .from('artworks')
      .insert({
        customer_name: 'Simple Test',
        customer_email: 'simple@test.com',
        access_token: 'simple-token-' + Date.now(),
        token_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        generation_step: 'pending',
        source_images: {},
        generated_images: {},
        delivery_images: {},
        processing_status: {}
      })
      .select()
      .single();
    
    if (createError) throw new Error(`Create failed: ${createError.message}`);
    
    console.log('✅ Test artwork created:', artwork.id);
    
    // Test direct update with minimal payload
    console.log('📝 Testing direct monalisa_base update...');
    
    const { data: updatedArtwork, error: updateError } = await supabase
      .from('artworks')
      .update({
        generated_images: {
          monalisa_base: 'https://example.com/direct-test.jpg',
          artwork_preview: '',
          artwork_full_res: ''
        },
        generation_step: 'monalisa_generation'
      })
      .eq('id', artwork.id)
      .select()
      .single();
    
    if (updateError) throw new Error(`Direct update failed: ${updateError.message}`);
    
    console.log('✅ Direct database update successful');
    console.log('📋 Updated generated_images:', JSON.stringify(updatedArtwork.generated_images, null, 2));
    
    // Verify the field is populated
    if (updatedArtwork.generated_images?.monalisa_base === 'https://example.com/direct-test.jpg') {
      console.log('✅ MonaLisa base field populated correctly via direct DB update');
    } else {
      console.log('❌ MonaLisa base field not populated correctly');
    }
    
    // Now test via API
    console.log('📝 Testing via API...');
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    const apiResponse = await fetch(`${baseUrl}/api/artwork/update`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        artwork_id: artwork.id,
        generated_image_url: 'https://example.com/api-test.jpg',
        generation_step: 'monalisa_generation'
      })
    });
    
    console.log('📊 API Response status:', apiResponse.status);
    
    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('❌ API failed:', errorText);
      return;
    }
    
    const apiResult = await apiResponse.json();
    console.log('📋 API result:', JSON.stringify(apiResult, null, 2));
    
    // Check final state
    const { data: finalArtwork } = await supabase
      .from('artworks')
      .select('*')
      .eq('id', artwork.id)
      .single();
    
    console.log('📋 Final generated_images:', JSON.stringify(finalArtwork.generated_images, null, 2));
    
    if (finalArtwork.generated_images?.monalisa_base === 'https://example.com/api-test.jpg') {
      console.log('✅ API update worked correctly');
    } else {
      console.log('❌ API update failed - monalisa_base not set correctly');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

simpleApiTest();
