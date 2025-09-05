require('dotenv').config({ path: '.env.local' });
const { fal } = require('@fal-ai/client');
const fs = require('fs');
const path = require('path');

// Debug: Check if credentials are loaded
console.log("🔑 FAL_KEY loaded:", process.env.FAL_KEY ? "YES" : "NO");
console.log("🔑 HF_TOKEN loaded:", process.env.HF_TOKEN ? "YES" : "NO");

// Configure fal client
fal.config({
  credentials: process.env.FAL_KEY || process.env.HF_TOKEN
});

async function testPetIntegration() {
  try {
    console.log("🐾 Testing Pet Integration - Step 2: Adding pets to Mona Lisa portrait");
    
    // Use the specific images requested
    const portraitImagePath = path.join(__dirname, '../public/images/flux-test-output.png');
    const petImagePath = path.join(__dirname, '../public/images/test pets/test-corgi.png');
    const outputImagePath = path.join(__dirname, '../public/images/pet-integration-output.jpg');
    
    let portraitUrl;
    
    // Check if we have a local MonaLisa portrait, otherwise use a sample
    if (fs.existsSync(portraitImagePath)) {
      console.log("📁 Loading MonaLisa portrait:", portraitImagePath);
      const portraitBuffer = fs.readFileSync(portraitImagePath);
      const portraitFile = new File([portraitBuffer], 'monalisa-portrait.png', { type: 'image/png' });
      portraitUrl = await fal.storage.upload(portraitFile);
      console.log("✅ Portrait uploaded:", portraitUrl);
    } else {
      // Use a sample portrait URL for testing
      portraitUrl = "https://v3.fal.media/files/rabbit/rmgBxhwGYb2d3pl3x9sKf_output.png";
      console.log("📁 Using sample portrait URL:", portraitUrl);
    }
    
    // Load pet image
    if (!fs.existsSync(petImagePath)) {
      throw new Error(`Pet image not found: ${petImagePath}`);
    }
    
    console.log("📁 Loading pet image:", petImagePath);
    const petBuffer = fs.readFileSync(petImagePath);
    const petFile = new File([petBuffer], 'test-pet.png', { type: 'image/png' });
    const petUrl = await fal.storage.upload(petFile);
    console.log("✅ Pet image uploaded:", petUrl);

    // Run pet integration with Flux Pro Kontext Max Multi
    console.log("🐾 Running pet integration with Flux Pro Kontext Max Multi...");
    const result = await fal.subscribe("fal-ai/flux-pro/kontext/max/multi", {
      input: {
        prompt: "Incorporate the pet into the painting of the woman. She is holding it in her lap. Keep the painted style and likeness of the woman and pet",
        guidance_scale: 3.5,
        num_images: 1,
        output_format: "jpeg",
        safety_tolerance: "2",
        image_urls: [portraitUrl, petUrl],
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

    console.log("✅ Pet integration complete!");
    console.log("📊 Result data:", result.data);
    console.log("🆔 Request ID:", result.requestId);
    
    if (!result.data || !result.data.images || !result.data.images[0]) {
      throw new Error("No final portrait with pets generated");
    }

    // Download and save the result
    console.log("💾 Downloading generated image...");
    const response = await fetch(result.data.images[0].url);
    const resultBuffer = await response.arrayBuffer();
    
    fs.writeFileSync(outputImagePath, Buffer.from(resultBuffer));
    console.log("✅ Image saved to:", outputImagePath);
    
    console.log("\n🎉 Pet integration test completed successfully!");
    console.log("📊 Result summary:");
    console.log("   - Portrait input:", portraitUrl);
    console.log("   - Pet input:", petImagePath);
    console.log("   - Output:", outputImagePath);
    console.log("   - Generated URL:", result.data.images[0].url);
    console.log("   - Request ID:", result.requestId);
    
    return result.data.images[0].url;

  } catch (error) {
    console.error("❌ Pet integration test failed:", error);
    throw error;
  }
}

// Run the test
if (require.main === module) {
  testPetIntegration()
    .then((url) => {
      console.log("🐾 Pet integration test successful! Final portrait URL:", url);
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Test failed:", error.message);
      process.exit(1);
    });
}

module.exports = { testPetIntegration };
