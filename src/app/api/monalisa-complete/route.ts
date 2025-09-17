import { NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';
import { storeFalImageInSupabase } from '@/lib/supabase-storage';

// Configure fal client
fal.config({
  credentials: process.env.FAL_KEY || process.env.HF_TOKEN
});

export async function POST(req: NextRequest) {
  try {
    console.log("🎨🐾 MonaLisa Maker - Complete Pipeline: User Photo + Pet → Final Portrait");
    
    let userImageUrl: string;
    let petImageUrl: string;
    const contentType = req.headers.get('content-type');

    if (contentType?.includes('multipart/form-data')) {
      // Handle file uploads
      const formData = await req.formData();
      const userImageFile = formData.get('userImage') as File;
      const petImageFile = formData.get('petImage') as File;
      
      if (!userImageFile || !petImageFile) {
        return NextResponse.json({ error: 'Both user image and pet image are required' }, { status: 400 });
      }

      console.log("☁️ Uploading images to fal storage...");
      userImageUrl = await fal.storage.upload(userImageFile);
      petImageUrl = await fal.storage.upload(petImageFile);
      console.log("✅ Images uploaded - User:", userImageUrl, "Pet:", petImageUrl);
    } else {
      // Handle JSON request with image URLs
      const body = await req.json();
      userImageUrl = body.userImageUrl;
      petImageUrl = body.petImageUrl;
      
      if (!userImageUrl || !petImageUrl) {
        return NextResponse.json({ error: 'Both userImageUrl and petImageUrl are required' }, { status: 400 });
      }
    }

    // Step 1: Transform user photo into Mona Lisa portrait
    console.log("🎨 Step 1: Running MonaLisa Maker transformation...");
    const monaLisaStream = await fal.stream('fal-ai/flux-kontext-lora', {
      input: {
        image_url: userImageUrl,
        prompt: "keep likeness, change pose and style to mona lisa, keep hairstyle",
        loras: [{
          path: "https://v3.fal.media/files/koala/HV-XcuBOG0z0apXA9dzP7_adapter_model.safetensors",
          scale: 1.0
        }],
        resolution_mode: "9:16" as const,
        guidance_scale: 7.5,
        num_inference_steps: 28,
        seed: Math.floor(Math.random() * 1000000)
      }
    });

    console.log("📡 Processing MonaLisa transformation...");
    for await (const event of monaLisaStream) {
      console.log("📝 MonaLisa event:", (event as any).type || 'processing');
    }

    const monaLisaResult = await monaLisaStream.done();

    if (!monaLisaResult || !monaLisaResult.images || !monaLisaResult.images[0]) {
      throw new Error("Step 1 failed: No Mona Lisa portrait generated");
    }

    const portraitUrl = monaLisaResult.images[0].url;
    console.log("✅ Step 1 complete! Portrait URL:", portraitUrl);

    // Step 2: Add pet to Mona Lisa portrait using Flux Pro Kontext Max Multi
    console.log("🐾 Step 2: Running pet integration with Flux Pro Kontext Max Multi...");
    const petIntegrationResult = await fal.subscribe("fal-ai/flux-pro/kontext/max/multi", {
      input: {
        prompt: "Incorporate the pet into the painting of the woman. She is holding it in her lap. Keep the painted style and likeness of the woman and pet",
        guidance_scale: 3.5,
        num_images: 1,
        output_format: "jpeg",
        safety_tolerance: "2",
        image_urls: [portraitUrl, petImageUrl],
        aspect_ratio: "2:3"
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

    // Return the image URL in JSON response instead of headers to avoid header size limits
    return NextResponse.json({
      success: true,
      generatedImageUrl: petIntegrationResult.data.images[0].url,
      requestId: petIntegrationResult.requestId,
      monaLisaPortraitUrl: portraitUrl
    });

  } catch (error) {
    console.error("❌ Complete pipeline error:", error);
    return NextResponse.json(
      { error: 'Complete MonaLisa Maker pipeline failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
