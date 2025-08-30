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
    const imagePath = path.join(__dirname, '../public/images/flux-test.png');
    
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

    // Test the Flux Kontext LoRA model with streaming
    console.log('🎨 Running Flux Kontext LoRA transformation...');
    const promptToUse = 'keep likeness, change pose and style to mona lisa';
    console.log('📝 Using prompt:', promptToUse);
    
    const stream = await fal.stream("fal-ai/flux-kontext-lora", {
      input: {
        image_url: imageUrl,
        prompt: promptToUse,
        model_name: null,
        loras: [{
          path: "https://v3.fal.media/files/koala/HV-XcuBOG0z0apXA9dzP7_adapter_model.safetensors",
          scale: 1
        }],
        embeddings: [],
        resolution_mode: "9:16"
      }
    });

    console.log('📡 Streaming events...');
    for await (const event of stream) {
      console.log('📝 Stream event:', event);
    }

    const result = await stream.done();

    console.log('✅ Transformation complete!');
    console.log('🖼️ Result:', result);
    
    if (result && result.images && result.images[0]) {
      const outputUrl = result.images[0].url;
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
    
    // Log detailed error information for validation errors
    if (error.status === 422 && error.body && error.body.detail) {
      console.error('🔍 Validation Error Details:', JSON.stringify(error.body.detail, null, 2));
    }
    
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
