#!/usr/bin/env node

/**
 * Test script for debugging iPhone camera upload issues
 * This script helps identify HEIC conversion and file format issues
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

const API_BASE = process.env.API_BASE || 'http://localhost:3000';

async function testHeicConversion() {
  console.log('🧪 Testing HEIC conversion and pet integration...\n');
  
  // Test with sample images from the e2e testing folder
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
    console.error('❌ Need at least 2 test images in:', testImagesDir);
    return;
  }
  
  const portraitImage = testImages[0];
  const petImage = testImages[1];
  
  console.log('📁 Using test images:');
  console.log('  Portrait:', portraitImage);
  console.log('  Pet:', petImage);
  console.log('');
  
  try {
    // Test pet integration API directly
    console.log('🐾 Testing pet integration API...');
    
    const formData = new FormData();
    formData.append('portrait', fs.createReadStream(path.join(testImagesDir, portraitImage)));
    formData.append('pet', fs.createReadStream(path.join(testImagesDir, petImage)));
    formData.append('artworkId', 'test_' + Date.now());
    
    const response = await fetch(`${API_BASE}/api/pet-integration`, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    });
    
    const result = await response.text();
    
    if (response.ok) {
      console.log('✅ Pet integration successful!');
      console.log('Response:', JSON.parse(result));
    } else {
      console.error('❌ Pet integration failed:');
      console.error('Status:', response.status);
      console.error('Response:', result);
      
      // Try to parse error details
      try {
        const errorData = JSON.parse(result);
        if (errorData.details) {
          console.error('Error details:', errorData.details);
        }
      } catch (parseError) {
        console.error('Could not parse error response');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function testFileFormats() {
  console.log('\n🔍 Testing file format detection...\n');
  
  // Simulate different file types that iPhone might produce
  const testCases = [
    { name: 'IMG_1234.HEIC', type: 'image/heic' },
    { name: 'IMG_5678.heic', type: 'image/heic' },
    { name: 'IMG_9012.jpg', type: 'image/jpeg' },
    { name: 'IMG_3456.JPG', type: 'image/jpeg' },
    { name: 'photo.png', type: 'image/png' },
    { name: 'IMG_7890', type: '' }, // No extension, empty MIME type
    { name: 'IMG_1111.HEIF', type: 'image/heif' },
  ];
  
  testCases.forEach(testCase => {
    const needsHeicConversion = testCase.type === 'image/heic' || testCase.type === 'image/heif' || 
        testCase.name.toLowerCase().endsWith('.heic') || testCase.name.toLowerCase().endsWith('.heif') ||
        (testCase.type === '' && testCase.name.toLowerCase().includes('img_'));
    
    const detectionReason = testCase.type === 'image/heic' ? 'MIME type' : 
                           testCase.type === 'image/heif' ? 'MIME type' :
                           testCase.name.toLowerCase().endsWith('.heic') ? 'file extension .heic' :
                           testCase.name.toLowerCase().endsWith('.heif') ? 'file extension .heif' :
                           'iPhone camera pattern';
    
    console.log(`📱 ${testCase.name} (${testCase.type || 'no MIME type'})`);
    console.log(`   Needs conversion: ${needsHeicConversion ? '✅' : '❌'}`);
    if (needsHeicConversion) {
      console.log(`   Reason: ${detectionReason}`);
    }
    console.log('');
  });
}

// Run tests
async function main() {
  console.log('🧪 iPhone Camera Upload Debug Tool\n');
  
  await testFileFormats();
  await testHeicConversion();
  
  console.log('\n✅ Debug tests completed!');
  console.log('\n💡 Tips for debugging iPhone uploads:');
  console.log('   1. Check browser console for "📱 File upload details" logs');
  console.log('   2. Look for HEIC conversion logs in the upload modal');
  console.log('   3. Check Vercel logs for detailed fal.ai validation errors');
  console.log('   4. Try selecting from photo library instead of taking new photos');
}

main().catch(console.error);
