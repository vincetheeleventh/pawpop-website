// Direct test of MonaLisa API to see the fal.ai upload response format
const fs = require('fs');
const path = require('path');

async function testMonaLisaAPI() {
  try {
    console.log('🧪 Testing MonaLisa API directly...');
    
    // Use a test image
    const testImagePath = path.join(__dirname, '../public/images/e2e testing/test-petmom.png');
    
    if (!fs.existsSync(testImagePath)) {
      console.error('❌ Test image not found:', testImagePath);
      return;
    }
    
    // Create form data
    const FormData = require('form-data');
    const form = new FormData();
    
    // Add the image file
    form.append('image', fs.createReadStream(testImagePath));
    form.append('artworkId', 'test-artwork-123');
    
    console.log('📤 Sending request to MonaLisa API...');
    
    // Make request to our API
    const response = await fetch('https://www.pawpopart.com/api/monalisa-maker', {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });
    
    console.log('📦 Response status:', response.status);
    console.log('📦 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('📦 Response body:', responseText);
    
    if (!response.ok) {
      console.error('❌ API request failed');
      return;
    }
    
    const result = JSON.parse(responseText);
    console.log('✅ API response:', result);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Use node-fetch for compatibility
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

testMonaLisaAPI();
