// Test script to understand fal.ai upload response format
const { fal } = require('@fal-ai/client');
const fs = require('fs');
const path = require('path');

// Configure fal client
fal.config({
  credentials: process.env.FAL_KEY || process.env.HF_TOKEN
});

async function testFalUpload() {
  try {
    console.log('🧪 Testing fal.ai upload response format...');
    
    // Use a test image from our e2e testing folder
    const testImagePath = path.join(__dirname, '../public/images/e2e testing/test-petmom.png');
    
    if (!fs.existsSync(testImagePath)) {
      console.error('❌ Test image not found:', testImagePath);
      console.log('Available images:');
      const testDir = path.join(__dirname, '../public/images/e2e testing/');
      if (fs.existsSync(testDir)) {
        fs.readdirSync(testDir).forEach(file => console.log('  -', file));
      }
      return;
    }
    
    // Create a File-like object
    const imageBuffer = fs.readFileSync(testImagePath);
    const imageFile = new File([imageBuffer], 'test-image.jpg', { type: 'image/jpeg' });
    
    console.log('📤 Uploading test image to fal.ai storage...');
    const uploadResult = await fal.storage.upload(imageFile);
    
    console.log('📦 Upload result type:', typeof uploadResult);
    console.log('📦 Upload result:', JSON.stringify(uploadResult, null, 2));
    
    // Test different property access patterns
    console.log('\n🔍 Testing property access:');
    console.log('uploadResult.url:', uploadResult?.url);
    console.log('uploadResult.file_url:', uploadResult?.file_url);
    console.log('uploadResult.data?.url:', uploadResult?.data?.url);
    console.log('uploadResult.data?.file_url:', uploadResult?.data?.file_url);
    
    // Check if it's a string
    if (typeof uploadResult === 'string') {
      console.log('✅ Result is a string URL:', uploadResult);
    } else {
      console.log('❌ Result is not a string, need to extract URL');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testFalUpload();
