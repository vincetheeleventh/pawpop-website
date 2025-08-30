#!/usr/bin/env node

/**
 * Standalone test script for fal.ai Flux LoRA model
 * Tests the Flux transformation using a local image
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Note: You'll need to install @fal-ai/client first:
// npm install @fal-ai/client

async function testFluxTransformation() {
  try {
    // Import fal client (will need to be installed)
    const { fal } = await import('@fal-ai/client');
    
    // Configure with your API key
    fal.config({
      credentials: process.env.FAL_KEY || process.env.HF_TOKEN
    });

    console.log('🔥 Starting Flux LoRA test...');
    console.log('🔑 API Key loaded:', process.env.FAL_KEY ? 'Yes' : 'No');

    // Load test image (you can change this path)
    const imagePath = path.join(__dirname, '../public/images/overlayed.png');
    
    if (!fs.existsSync(imagePath)) {
      console.error('❌ Test image not found at:', imagePath);
      console.log('💡 Please ensure you have a test image at the specified path');
      return;
    }

    console.log('📥 Loading image from:', imagePath);
    const imageBuffer = fs.readFileSync(imagePath);
    
    // Upload image to fal storage
    console.log('☁️ Uploading image to fal storage...');
    const imageFile = new File([imageBuffer], 'test-image.png', { type: 'image/png' });
    const imageUrl = await fal.storage.upload(imageFile);
    console.log('✅ Image uploaded:', imageUrl);

    // Test the Flux LoRA model
    console.log('🎨 Running Flux transformation...');
    const promptToUse = 'Place it';
    console.log('📝 Using prompt:', promptToUse);
    
    const result = await fal.subscribe('fal-ai/flux-kontext-lora', {
      input: {
        image_url: imageUrl,
        prompt: promptToUse,
        strength: 1.0,
        guidance_scale: 7.5,
        num_inference_steps: 28,
        seed: Math.floor(Math.random() * 1000000)
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS') {
          console.log('⏳ Processing:', update.status);
          if (update.logs) {
            update.logs.forEach(log => console.log('📝', log.message));
          }
        }
      }
    });

    console.log('✅ Transformation complete!');
    console.log('🖼️ Result:', result.data);
    
    if (result.data && result.data.images && result.data.images[0]) {
      const outputUrl = result.data.images[0].url;
      console.log('🌐 Output image URL:', outputUrl);
      
      // Optionally download the result
      console.log('💾 Downloading result...');
      const response = await fetch(outputUrl);
      const resultBuffer = Buffer.from(await response.arrayBuffer());
      
      const outputPath = path.join(__dirname, '../public/images/flux-test-output.png');
      fs.writeFileSync(outputPath, resultBuffer);
      console.log('✅ Result saved to:', outputPath);
    }

  } catch (error) {
    console.error('💥 Error during Flux test:', error);
    console.error('Stack:', error.stack);
    
    if (error.message.includes('credentials')) {
      console.log('\n💡 Setup Instructions:');
      console.log('1. Get your API key from fal.ai or Hugging Face');
      console.log('2. Set environment variable: export FAL_KEY="your-api-key"');
      console.log('3. Or set: export HF_TOKEN="your-hf-token"');
    }
  }
}

// Run the test
if (require.main === module) {
  testFluxTransformation();
}

module.exports = { testFluxTransformation };
