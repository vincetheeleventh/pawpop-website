require('dotenv').config();
const { fal } = require('@fal-ai/client');
const fs = require('fs');
const path = require('path');

// Configure fal client
fal.config({
  credentials: process.env.FAL_KEY || process.env.HF_TOKEN
});

async function testMonaLisaMaker() {
  try {
    console.log("🎨 Testing MonaLisa Maker - Step 1: Portrait Transformation");
    
    // Load test image
    const inputImagePath = path.join(__dirname, '../public/images/flux-test.png');
    const outputImagePath = path.join(__dirname, '../public/images/monalisa-maker-output.png');
    
    if (!fs.existsSync(inputImagePath)) {
      throw new Error(`Input image not found: ${inputImagePath}`);
    }
    
    console.log("📁 Loading input image:", inputImagePath);
    const imageBuffer = fs.readFileSync(inputImagePath);
    
    // Upload image to fal storage
    console.log("☁️ Uploading image to fal storage...");
    const imageFile = new File([imageBuffer], 'test-user-photo.png', { type: 'image/png' });
    const imageUrl = await fal.storage.upload(imageFile);
    console.log("✅ Image uploaded:", imageUrl);

    // Run MonaLisa Maker transformation
    console.log("🎨 Running MonaLisa Maker transformation...");
    const stream = await fal.stream('fal-ai/flux-kontext-lora', {
      input: {
        image_url: imageUrl,
        prompt: "keep likeness, change pose and style to mona lisa, keep hairstyle",
        loras: [{
          path: "https://v3.fal.media/files/koala/HV-XcuBOG0z0apXA9dzP7_adapter_model.safetensors",
          scale: 1.0
        }],
        resolution_mode: "9:16",
        guidance_scale: 7.5,
        num_inference_steps: 28,
        seed: Math.floor(Math.random() * 1000000)
      }
    });

    console.log("📡 Processing stream...");
    for await (const event of stream) {
      console.log("📝 Stream event:", event.type || 'processing');
    }

    const result = await stream.done();
    
    if (!result || !result.images || !result.images[0]) {
      throw new Error("No Mona Lisa portrait generated");
    }

    console.log("✅ MonaLisa Maker transformation complete!");
    console.log("🖼️ Generated image URL:", result.images[0].url);

    // Download and save the result
    console.log("💾 Downloading generated image...");
    const response = await fetch(result.images[0].url);
    const resultBuffer = await response.arrayBuffer();
    
    fs.writeFileSync(outputImagePath, Buffer.from(resultBuffer));
    console.log("✅ Image saved to:", outputImagePath);
    
    console.log("\n🎉 MonaLisa Maker test completed successfully!");
    console.log("📊 Result summary:");
    console.log("   - Input:", inputImagePath);
    console.log("   - Output:", outputImagePath);
    console.log("   - Generated URL:", result.images[0].url);
    
    return result.images[0].url;

  } catch (error) {
    console.error("❌ MonaLisa Maker test failed:", error);
    throw error;
  }
}

// Run the test
if (require.main === module) {
  testMonaLisaMaker()
    .then((url) => {
      console.log("🎨 MonaLisa Maker test successful! Portrait URL:", url);
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Test failed:", error.message);
      process.exit(1);
    });
}

module.exports = { testMonaLisaMaker };
