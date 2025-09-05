require('dotenv').config();
const { fal } = require('@fal-ai/client');
const fs = require('fs');
const path = require('path');

// Configure fal client
fal.config({
  credentials: process.env.FAL_KEY || process.env.HF_TOKEN
});

async function testCompletePipeline() {
  try {
    console.log("🎨🐾 Testing Complete MonaLisa Maker Pipeline: User Photo + Pet → Final Portrait");
    
    // Load test images
    const userImagePath = path.join(__dirname, '../public/images/flux-test.png');
    const petImagePath = path.join(__dirname, '../public/images/test pets/test-corgi.png');
    const outputImagePath = path.join(__dirname, '../public/images/complete-pipeline-output.jpg');
    
    if (!fs.existsSync(userImagePath)) {
      throw new Error(`User image not found: ${userImagePath}`);
    }
    
    if (!fs.existsSync(petImagePath)) {
      throw new Error(`Pet image not found: ${petImagePath}`);
    }
    
    console.log("📁 Loading images:");
    console.log("   - User photo:", userImagePath);
    console.log("   - Pet photo:", petImagePath);
    
    const userImageBuffer = fs.readFileSync(userImagePath);
    const petImageBuffer = fs.readFileSync(petImagePath);
    
    // Upload images to fal storage
    console.log("☁️ Uploading images to fal storage...");
    const userImageFile = new File([userImageBuffer], 'test-user-photo.png', { type: 'image/png' });
    const petImageFile = new File([petImageBuffer], 'test-pet.png', { type: 'image/png' });
    
    const userImageUrl = await fal.storage.upload(userImageFile);
    const petImageUrl = await fal.storage.upload(petImageFile);
    
    console.log("✅ Images uploaded:");
    console.log("   - User:", userImageUrl);
    console.log("   - Pet:", petImageUrl);

    // Step 1: Transform user photo into Mona Lisa portrait
    console.log("\n🎨 Step 1: Running MonaLisa Maker transformation...");
    const monaLisaStream = await fal.stream('fal-ai/flux-kontext-lora', {
      input: {
        image_url: userImageUrl,
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

    console.log("📡 Processing MonaLisa transformation...");
    for await (const event of monaLisaStream) {
      console.log("📝 MonaLisa event:", event.type || 'processing');
    }

    const monaLisaResult = await monaLisaStream.done();

    if (!monaLisaResult || !monaLisaResult.images || !monaLisaResult.images[0]) {
      throw new Error("Step 1 failed: No Mona Lisa portrait generated");
    }

    const portraitUrl = monaLisaResult.images[0].url;
    console.log("✅ Step 1 complete! Portrait URL:", portraitUrl);

    // Step 2: Add pet to Mona Lisa portrait using Flux Pro Kontext Max
    console.log("\n🐾 Step 2: Running pet integration with Flux Pro Kontext Max...");
    const petIntegrationResult = await fal.subscribe("fal-ai/flux-pro/kontext/max", {
      input: {
        prompt: "Incorporate the pets into the painting of the woman. She is holding them in her lap. Keep the painted style and likeness of the woman and pets",
        guidance_scale: 3.5,
        num_images: 1,
        output_format: "jpeg",
        safety_tolerance: "2",
        image_url: portraitUrl,
        aspect_ratio: "9:16"
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          console.log("⏳ Pet integration processing:", update.status);
          if (update.logs) {
            update.logs.map((log) => log.message).forEach(console.log);
          }
        }
      },
    });

    console.log("✅ Step 2 complete! Pet integration finished!");
    console.log("📊 Final result data:", petIntegrationResult.data);
    console.log("🆔 Request ID:", petIntegrationResult.requestId);

    if (!petIntegrationResult.data || !petIntegrationResult.data.images || !petIntegrationResult.data.images[0]) {
      throw new Error("Step 2 failed: No final portrait with pets generated");
    }

    // Download and save the final result
    console.log("💾 Downloading final generated image...");
    const finalImageResponse = await fetch(petIntegrationResult.data.images[0].url);
    const finalImageBuffer = await finalImageResponse.arrayBuffer();
    
    fs.writeFileSync(outputImagePath, Buffer.from(finalImageBuffer));
    console.log("✅ Final image saved to:", outputImagePath);
    
    console.log("\n🎉 Complete pipeline test completed successfully!");
    console.log("📊 Pipeline summary:");
    console.log("   - User input:", userImagePath);
    console.log("   - Pet input:", petImagePath);
    console.log("   - MonaLisa portrait:", portraitUrl);
    console.log("   - Final output:", outputImagePath);
    console.log("   - Final URL:", petIntegrationResult.data.images[0].url);
    console.log("   - Request ID:", petIntegrationResult.requestId);
    
    return {
      portraitUrl,
      finalUrl: petIntegrationResult.data.images[0].url,
      requestId: petIntegrationResult.requestId
    };

  } catch (error) {
    console.error("❌ Complete pipeline test failed:", error);
    throw error;
  }
}

// Run the test
if (require.main === module) {
  testCompletePipeline()
    .then((result) => {
      console.log("🎨🐾 Complete pipeline test successful!");
      console.log("   - Portrait:", result.portraitUrl);
      console.log("   - Final:", result.finalUrl);
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Test failed:", error.message);
      process.exit(1);
    });
}

module.exports = { testCompletePipeline };
