// Simple API test to isolate the FormData issue
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function testSimpleAPI() {
  try {
    console.log('🧪 Testing simple API call...');
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    // Test 1: Simple JSON request
    console.log('📝 Test 1: JSON request to monalisa-complete...');
    const jsonResponse = await fetch(`${baseUrl}/api/monalisa-complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userImageUrl: 'https://example.com/user.jpg',
        petImageUrl: 'https://example.com/pet.jpg',
        artworkId: 'test-123'
      })
    });
    
    console.log('JSON Response status:', jsonResponse.status);
    const jsonResult = await jsonResponse.text();
    console.log('JSON Response:', jsonResult.substring(0, 200));
    
    // Test 2: Individual API endpoints
    console.log('\n📝 Test 2: Individual MonaLisa Maker...');
    const monaResponse = await fetch(`${baseUrl}/api/monalisa-maker`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageUrl: 'https://fal.media/files/rabbit/dHrFcrapu6KT3KOlbue8k_bb5f501b562245dd90f7247d1f7a955a.jpg'
      })
    });
    
    console.log('MonaLisa Response status:', monaResponse.status);
    if (monaResponse.ok) {
      console.log('✅ MonaLisa Maker working');
    } else {
      const errorText = await monaResponse.text();
      console.log('❌ MonaLisa error:', errorText.substring(0, 200));
    }
    
    // Test 3: Artwork update
    console.log('\n📝 Test 3: Artwork update...');
    const updateResponse = await fetch(`${baseUrl}/api/artwork/update`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        artwork_id: '75691047-3854-4326-b037-0527f40f9359',
        generated_image_url: 'https://example.com/test.jpg',
        generation_step: 'monalisa_generation'
      })
    });
    
    console.log('Update Response status:', updateResponse.status);
    if (updateResponse.ok) {
      const updateResult = await updateResponse.json();
      console.log('✅ Artwork update working');
    } else {
      const errorText = await updateResponse.text();
      console.log('❌ Update error:', errorText.substring(0, 200));
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSimpleAPI();
