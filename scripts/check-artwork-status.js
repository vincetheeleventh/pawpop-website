// Check artwork status for debugging
async function checkArtworkStatus() {
  const token = 'fb4572914f786d06b9fbbec5b29fafb1adf397c9ac4f350464e7426d262426f7';
  const baseUrl = 'http://localhost:3000';
  
  try {
    console.log(`🔍 Checking artwork status for token: ${token}`);
    
    const response = await fetch(`${baseUrl}/api/artwork/${token}`);
    
    if (!response.ok) {
      console.error(`❌ API Error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('✅ Artwork data received:');
    console.log(JSON.stringify(data, null, 2));
    
    const artwork = data.artwork;
    console.log('\n📊 Status Analysis:');
    console.log('- generation_step:', artwork.generation_step);
    console.log('- processing_status:', JSON.stringify(artwork.processing_status, null, 2));
    console.log('- generated_images:', artwork.generated_images ? 'Present' : 'Missing');
    console.log('- delivery_images:', artwork.delivery_images ? 'Present' : 'Missing');
    console.log('- source_images:', artwork.source_images ? 'Present' : 'Missing');
    
    // Check completion logic
    const isCompleted = artwork.generation_step === 'completed';
    console.log('\n🎯 Completion Check:');
    console.log('- Should show completed artwork:', isCompleted);
    console.log('- Will show "Artwork Confirmed!" if:', !isCompleted);
    
    // Check upscaling status
    if (artwork.processing_status?.upscaling) {
      console.log('\n🔍 Upscaling Status:');
      console.log('- Upscale status:', artwork.processing_status.upscaling);
      console.log('- Full resolution image:', artwork.generated_images?.artwork_full_res ? 'Present' : 'Missing');
    }
    
  } catch (error) {
    console.error('❌ Error checking artwork:', error.message);
  }
}

checkArtworkStatus();
