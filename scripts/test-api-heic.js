#!/usr/bin/env node

/**
 * Test the actual API endpoints with HEIC conversion
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// Use dynamic import for fetch
async function testAPI() {
  const fetch = (await import('node-fetch')).default;
  
  console.log('🧪 Testing API endpoints with HEIC conversion...\n');
  
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
  
  if (testImages.length < 1) {
    console.error('❌ Need at least 1 test image in:', testImagesDir);
    return;
  }
  
  const testImage = testImages[0];
  const testImagePath = path.join(testImagesDir, testImage);
  
  console.log('📁 Using test image:', testImage);
  console.log('📊 Image size:', Math.round(fs.statSync(testImagePath).size / 1024), 'KB');
  
  try {
    // Test 1: MonaLisa Maker API with simulated HEIC file
    console.log('\n🎨 Testing MonaLisa Maker API...');
    
    const formData = new FormData();
    
    // Create a simulated HEIC file by renaming the test image
    const imageBuffer = fs.readFileSync(testImagePath);
    const heicFileName = 'IMG_1234.HEIC';
    
    formData.append('image', imageBuffer, {
      filename: heicFileName,
      contentType: 'image/heic'
    });
    formData.append('artworkId', 'test_' + Date.now());
    
    console.log('📤 Uploading simulated HEIC file:', heicFileName);
    
    const monaLisaResponse = await fetch(`${API_BASE}/api/monalisa-maker`, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    });
    
    if (monaLisaResponse.ok) {
      const result = await monaLisaResponse.json();
      console.log('✅ MonaLisa API successful!');
      console.log('📊 Response keys:', Object.keys(result));
      if (result.imageUrl) {
        console.log('🖼️  Generated image URL:', result.imageUrl.substring(0, 80) + '...');
      }
    } else {
      const errorText = await monaLisaResponse.text();
      console.log('❌ MonaLisa API failed:');
      console.log('Status:', monaLisaResponse.status);
      console.log('Response:', errorText.substring(0, 500));
    }
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}

async function testConversionLogic() {
  console.log('\n🔄 Testing conversion logic directly...\n');
  
  // Test the exact logic from our API
  const convertToJpegIfNeeded = async (fileName, fileType, buffer) => {
    const problematicFormats = ['image/avif', 'image/heic', 'image/heif'];
    const isHeicByName = fileName.toLowerCase().endsWith('.heic') || fileName.toLowerCase().endsWith('.heif');
    
    if (problematicFormats.includes(fileType) || isHeicByName) {
      console.log(`🔄 Server-side conversion needed: ${fileName} (${fileType})`);
      
      // For HEIC/HEIF files, attempt server-side conversion using Sharp
      if (fileType === 'image/heic' || fileType === 'image/heif' || isHeicByName) {
        try {
          console.log('🔄 Attempting server-side HEIC conversion with Sharp...');
          
          const sharp = await import('sharp');
          
          // Convert HEIC to JPEG using Sharp
          const jpegBuffer = await sharp.default(buffer)
            .jpeg({ quality: 85 })
            .toBuffer();
          
          console.log('✅ Server-side HEIC conversion successful:', {
            originalSize: Math.round(buffer.length / 1024),
            convertedSize: Math.round(jpegBuffer.length / 1024),
            originalName: fileName,
            convertedName: fileName.replace(/\.(heic|heif)$/i, '.jpg')
          });
          
          return {
            buffer: jpegBuffer,
            fileName: fileName.replace(/\.(heic|heif)$/i, '.jpg'),
            type: 'image/jpeg'
          };
          
        } catch (sharpError) {
          console.warn('⚠️ Server-side HEIC conversion failed:', sharpError.message);
          return null;
        }
      }
    }
    
    return {
      buffer: buffer,
      fileName: fileName,
      type: fileType
    };
  };
  
  // Test with a real image file
  const testImagesDir = path.join(__dirname, '..', 'public', 'images', 'e2e testing');
  const testImages = fs.readdirSync(testImagesDir).filter(file => 
    file.toLowerCase().endsWith('.jpg') || file.toLowerCase().endsWith('.jpeg')
  );
  
  if (testImages.length > 0) {
    const testImage = testImages[0];
    const testImagePath = path.join(testImagesDir, testImage);
    const imageBuffer = fs.readFileSync(testImagePath);
    
    console.log('🧪 Testing with simulated HEIC file...');
    const result = await convertToJpegIfNeeded('IMG_TEST.HEIC', 'image/heic', imageBuffer);
    
    if (result) {
      console.log('✅ Conversion logic test passed:', {
        fileName: result.fileName,
        type: result.type,
        size: Math.round(result.buffer.length / 1024) + 'KB'
      });
    } else {
      console.log('❌ Conversion logic test failed');
    }
  }
}

// Run tests
async function main() {
  console.log('🧪 API HEIC Conversion Test Suite\n');
  
  await testConversionLogic();
  
  // Wait a bit for the dev server to be fully ready
  console.log('⏳ Waiting for dev server to be ready...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  await testAPI();
  
  console.log('\n✅ API test suite completed!');
  console.log('\n💡 Next steps:');
  console.log('   1. Test with actual iPhone camera upload in browser');
  console.log('   2. Monitor Vercel logs for conversion success');
  console.log('   3. Verify fal.ai no longer receives HEIC files');
}

main().catch(console.error);
