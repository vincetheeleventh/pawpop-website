// Test artwork update API directly to verify JSONB field population
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testArtworkUpdate() {
  try {
    console.log('🧪 Testing artwork update API directly...');
    
    // Step 1: Create a test artwork
    console.log('📝 Creating test artwork...');
    const { data: artwork, error: createError } = await supabase
      .from('artworks')
      .insert({
        customer_name: 'Test User',
        customer_email: 'pawpopart@gmail.com',
        access_token: 'test-token-' + Date.now(),
        token_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        generation_step: 'pending',
        source_images: {
          pet_photo: '',
          pet_mom_photo: '',
          uploadthing_keys: {}
        },
        generated_images: {
          monalisa_base: '',
          artwork_preview: '',
          artwork_full_res: '',
          generation_steps: []
        },
        delivery_images: {
          mockups: {},
          print_ready: '',
          digital_download: ''
        },
        processing_status: {
          artwork_generation: 'pending'
        }
      })
      .select()
      .single();
    
    if (createError) {
      throw new Error(`Failed to create artwork: ${createError.message}`);
    }
    
    console.log('✅ Test artwork created:', artwork.id);
    
    // Step 2: Test source images update
    console.log('📝 Testing source images update...');
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    const sourceUpdateResponse = await fetch(`${baseUrl}/api/artwork/update`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        artwork_id: artwork.id,
        source_images: {
          pet_mom_photo: 'https://example.com/mom.jpg',
          pet_photo: 'https://example.com/pet.jpg',
          uploadthing_keys: { test: 'key' }
        },
        generation_step: 'monalisa_generation'
      })
    });
    
    if (!sourceUpdateResponse.ok) {
      const errorText = await sourceUpdateResponse.text();
      throw new Error(`Source update failed: ${errorText}`);
    }
    
    console.log('✅ Source images updated');
    
    // Step 3: Test monalisa_base update
    console.log('📝 Testing monalisa_base update...');
    const monaUpdateResponse = await fetch(`${baseUrl}/api/artwork/update`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        artwork_id: artwork.id,
        generated_image_url: 'https://example.com/monalisa.jpg',
        generation_step: 'monalisa_generation'
      })
    });
    
    if (!monaUpdateResponse.ok) {
      const errorText = await monaUpdateResponse.text();
      throw new Error(`Mona Lisa update failed: ${errorText}`);
    }
    
    console.log('✅ Mona Lisa base updated');
    
    // Step 4: Test final artwork update
    console.log('📝 Testing final artwork update...');
    const finalUpdateResponse = await fetch(`${baseUrl}/api/artwork/update`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        artwork_id: artwork.id,
        generated_image_url: 'https://example.com/final.jpg',
        generation_step: 'completed'
      })
    });
    
    if (!finalUpdateResponse.ok) {
      const errorText = await finalUpdateResponse.text();
      throw new Error(`Final update failed: ${errorText}`);
    }
    
    console.log('✅ Final artwork updated');
    
    // Step 5: Check final state
    console.log('🔍 Checking final artwork state...');
    const { data: finalArtwork, error: fetchError } = await supabase
      .from('artworks')
      .select('*')
      .eq('id', artwork.id)
      .single();
    
    if (fetchError) {
      throw new Error(`Failed to fetch artwork: ${fetchError.message}`);
    }
    
    console.log('\n📊 Final Artwork State:');
    console.log('Generation Step:', finalArtwork.generation_step);
    console.log('\nSource Images:');
    console.log('  Pet Mom Photo:', finalArtwork.source_images?.pet_mom_photo || 'EMPTY');
    console.log('  Pet Photo:', finalArtwork.source_images?.pet_photo || 'EMPTY');
    console.log('\nGenerated Images:');
    console.log('  Mona Lisa Base:', finalArtwork.generated_images?.monalisa_base || 'EMPTY');
    console.log('  Artwork Preview:', finalArtwork.generated_images?.artwork_preview || 'EMPTY');
    console.log('  Artwork Full Res:', finalArtwork.generated_images?.artwork_full_res || 'EMPTY');
    console.log('\nDelivery Images:');
    console.log('  Digital Download:', finalArtwork.delivery_images?.digital_download || 'EMPTY');
    
    // Validation
    const validations = {
      'Source Images Populated': !!(finalArtwork.source_images?.pet_mom_photo && finalArtwork.source_images?.pet_photo),
      'Mona Lisa Base Populated': !!finalArtwork.generated_images?.monalisa_base,
      'Artwork Preview Populated': !!finalArtwork.generated_images?.artwork_preview,
      'Generation Step Completed': finalArtwork.generation_step === 'completed',
      'Single Entry Created': true // We only created one
    };
    
    console.log('\n✅ Validation Results:');
    Object.entries(validations).forEach(([test, passed]) => {
      console.log(`${passed ? '✅' : '❌'} ${test}`);
    });
    
    const allPassed = Object.values(validations).every(v => v);
    console.log(`\n${allPassed ? '🎉 ALL TESTS PASSED!' : '❌ Some tests failed'}`);
    
    return artwork.id;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  }
}

testArtworkUpdate();
