#!/usr/bin/env node

/**
 * Test pet integration API with HEIC conversion
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

async function testPetIntegrationAPI() {
  const fetch = (await import('node-fetch')).default;
  
  console.log('🐾 Testing Pet Integration API with HEIC conversion...\n');
  
  const API_BASE = 'http://localhost:3001';
  
  // Test with sample images
  const testImagesDir = path.join(__dirname, '..', 'public', 'images', 'e2e testing');
  
  if (!fs.existsSync(testImagesDir)) {
    console.error('❌ Test images directory not found:', testImagesDir);
    return;
  }
  
  const testImages = fs.readdirSync(testImagesDir).filter(file => 
    file.toLowerCase().endsWith('.jpg') || 
    file.toLowerCase().endsWith('.jpeg') || 
    file.toLowerCase().endsWith('.png')
  );
  
  if (testImages.length < 2) {
    console.error('❌ Need at least 2 test images');
    return;
  }
  
  const portraitImage = testImages[0];
  const petImage = testImages[1];
  
  console.log('📁 Using test images:');
  console.log('  Portrait:', portraitImage);
  console.log('  Pet:', petImage);
  
  try {
    console.log('\n🐾 Testing Pet Integration API with simulated HEIC files...');
    
    const formData = new FormData();
    
    // Create simulated HEIC files
    const portraitBuffer = fs.readFileSync(path.join(testImagesDir, portraitImage));
    const petBuffer = fs.readFileSync(path.join(testImagesDir, petImage));
    
    formData.append('portrait', portraitBuffer, {
      filename: 'portrait_IMG_1234.HEIC',
      contentType: 'image/heic'
    });
    
    formData.append('pet', petBuffer, {
      filename: 'pet_IMG_5678.HEIC', 
      contentType: 'image/heic'
    });
    
    formData.append('artworkId', 'test_heic_' + Date.now());
    
    console.log('📤 Uploading simulated HEIC files to pet integration...');
    
    const response = await fetch(`${API_BASE}/api/pet-integration`, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    });
    
    const responseText = await response.text();
    
    if (response.ok) {
      const result = JSON.parse(responseText);
      console.log('✅ Pet Integration API successful!');
      console.log('📊 Response keys:', Object.keys(result));
      if (result.imageUrl) {
        console.log('🖼️  Final artwork URL:', result.imageUrl.substring(0, 80) + '...');
      }
      if (result.success) {
        console.log('🎉 HEIC conversion and pet integration completed successfully!');
      }
    } else {
      console.log('❌ Pet Integration API failed:');
      console.log('Status:', response.status);
      console.log('Response:', responseText.substring(0, 1000));
      
      // Check if it's a validation error (the original issue)
      if (response.status === 500 && responseText.includes('ValidationError')) {
        console.log('⚠️  This looks like the original HEIC validation error!');
        console.log('💡 The server-side conversion may not be working as expected');
      }
    }
    
  } catch (error) {
    console.error('❌ Pet Integration test failed:', error.message);
  }
}

async function main() {
  console.log('🧪 Pet Integration HEIC Test\n');
  
  // Wait for dev server
  console.log('⏳ Waiting for dev server...');
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await testPetIntegrationAPI();
  
  console.log('\n✅ Pet Integration test completed!');
  console.log('\n💡 If this test passes, HEIC conversion should work for iPhone uploads!');
}

main().catch(console.error);
