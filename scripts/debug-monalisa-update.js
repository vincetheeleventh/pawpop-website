// Debug the monalisa_base update issue
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function debugMonaLisaUpdate() {
  try {
    console.log('🔍 Debugging monalisa_base update issue...');
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    // Create a test artwork
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    const { data: artwork, error: createError } = await supabase
      .from('artworks')
      .insert({
        customer_name: 'Debug Test',
        customer_email: 'debug@test.com',
        access_token: 'debug-token-' + Date.now(),
        token_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        generation_step: 'pending',
        source_images: { pet_photo: '', pet_mom_photo: '', uploadthing_keys: {} },
        generated_images: { monalisa_base: '', artwork_preview: '', artwork_full_res: '', generation_steps: [] },
        delivery_images: { mockups: {}, print_ready: '', digital_download: '' },
        processing_status: { artwork_generation: 'pending' }
      })
      .select()
      .single();
    
    if (createError) throw new Error(`Create failed: ${createError.message}`);
    
    console.log('✅ Test artwork created:', artwork.id);
    
    // Test the monalisa_generation step with detailed logging
    console.log('📝 Testing monalisa_generation step...');
    
    const updatePayload = {
      artwork_id: artwork.id,
      generated_image_url: 'https://fal.media/files/rabbit/dHrFcrapu6KT3KOlbue8k_bb5f501b562245dd90f7247d1f7a955a.jpg',
      generation_step: 'monalisa_generation'
    };
    
    console.log('📋 Update payload:', JSON.stringify(updatePayload, null, 2));
    
    const response = await fetch(`${baseUrl}/api/artwork/update`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatePayload)
    });
    
    console.log('📊 Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Update failed:', errorText);
      return;
    }
    
    const result = await response.json();
    console.log('📋 Update result:', JSON.stringify(result, null, 2));
    
    // Check the database directly
    console.log('🔍 Checking database state...');
    const { data: updatedArtwork, error: fetchError } = await supabase
      .from('artworks')
      .select('*')
      .eq('id', artwork.id)
      .single();
    
    if (fetchError) throw new Error(`Fetch failed: ${fetchError.message}`);
    
    console.log('\n📊 Database State After Update:');
    console.log('Generation Step:', updatedArtwork.generation_step);
    console.log('Generated Images:', JSON.stringify(updatedArtwork.generated_images, null, 2));
    
    // Check if monalisa_base is populated
    const monaLisaBase = updatedArtwork.generated_images?.monalisa_base;
    console.log('\n🎯 MonaLisa Base Result:');
    console.log('Value:', monaLisaBase || 'EMPTY');
    console.log('Type:', typeof monaLisaBase);
    console.log('Length:', monaLisaBase ? monaLisaBase.length : 0);
    
    if (monaLisaBase && monaLisaBase.length > 0) {
      console.log('✅ MonaLisa base populated successfully!');
    } else {
      console.log('❌ MonaLisa base is still empty');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugMonaLisaUpdate();
