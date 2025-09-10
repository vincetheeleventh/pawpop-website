// Fix artwork status to completed
async function fixArtworkStatus() {
  const artworkId = '3175c5c6-1048-46d6-8002-85d8bc6d8dde';
  const baseUrl = 'http://localhost:3000';
  
  try {
    console.log(`🔧 Updating artwork ${artworkId} to completed status...`);
    
    const response = await fetch(`${baseUrl}/api/artwork/update`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        artwork_id: artworkId,
        generation_step: 'completed',
        generated_images: {
          artwork_preview: 'https://example.com/generated-artwork.jpg'
        },
        processing_status: {
          artwork_generation: 'completed'
        }
      })
    });
    
    if (!response.ok) {
      console.error(`❌ Update failed: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('✅ Artwork status updated successfully:');
    console.log(JSON.stringify(data, null, 2));
    
    console.log('\n🎯 Now try visiting the artwork page again!');
    console.log('URL: http://localhost:3000/artwork/fb4572914f786d06b9fbbec5b29fafb1adf397c9ac4f350464e7426d262426f7');
    
  } catch (error) {
    console.error('❌ Error updating artwork:', error.message);
  }
}

fixArtworkStatus();
