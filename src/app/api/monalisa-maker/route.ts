import { NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';

// Configure fal client
fal.config({
  credentials: process.env.FAL_KEY || process.env.HF_TOKEN
});

export async function POST(req: NextRequest) {
  try {
    console.log("🎨 MonaLisa Maker - Step 1: Portrait Transformation");
    
    let imageUrl: string;
    const contentType = req.headers.get('content-type');

    if (contentType?.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await req.formData();
      const imageFile = formData.get('image') as File;
      
      if (!imageFile) {
        return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
      }

      // Log image details for debugging
      console.log("📊 Image details:", {
        name: imageFile.name,
        size: imageFile.size,
        type: imageFile.type,
        sizeInMB: (imageFile.size / 1024 / 1024).toFixed(2) + ' MB'
      });

      // Check image size (fal.ai typically has limits around 10MB)
      const maxSizeInMB = 10;
      const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
      
      if (imageFile.size > maxSizeInBytes) {
        console.error(`❌ Image too large: ${(imageFile.size / 1024 / 1024).toFixed(2)}MB > ${maxSizeInMB}MB`);
        return NextResponse.json({ 
          error: `Image too large. Maximum size is ${maxSizeInMB}MB, but uploaded image is ${(imageFile.size / 1024 / 1024).toFixed(2)}MB` 
        }, { status: 413 });
      }

      console.log("☁️ Uploading user photo to fal storage...");
      imageUrl = await fal.storage.upload(imageFile);
      console.log("✅ Image uploaded:", imageUrl);
    } else {
      // Handle JSON request with image URL
      const body = await req.json();
      imageUrl = body.imageUrl;
      
      if (!imageUrl) {
        return NextResponse.json({ error: 'No imageUrl provided' }, { status: 400 });
      }
    }

    // Step 1: Transform user photo into Mona Lisa portrait
    console.log("🎨 Running MonaLisa Maker transformation...");
    const stream = await fal.stream('fal-ai/flux-kontext-lora', {
      input: {
        image_url: imageUrl,
        prompt: "keep likeness and hairstyle the same, change pose and style to mona lisa",
        loras: [{
          path: "https://v3.fal.media/files/koala/HV-XcuBOG0z0apXA9dzP7_adapter_model.safetensors",
          scale: 1.0
        }],
        resolution_mode: "2:3" as const,
        guidance_scale: 2.5,
        num_inference_steps: 28,
        seed: Math.floor(Math.random() * 1000000)
      }
    });

    console.log("📡 Processing MonaLisa transformation...");
    for await (const event of stream) {
      // Only log event type, not the full event data to avoid giant hashes
      const eventType = (event as any).type;
      if (eventType && eventType !== 'logs') {
        console.log("📝 Stream event:", eventType);
      }
    }

    const result = await stream.done();

    if (!result || !result.images || !result.images[0]) {
      throw new Error("No Mona Lisa portrait generated");
    }

    console.log("✅ MonaLisa Maker transformation complete!");
    
    // Return the image URL in JSON format for the frontend
    return NextResponse.json({
      imageUrl: result.images[0].url,
      success: true
    });

  } catch (error) {
    console.error("❌ MonaLisa Maker error:", error);
    
    // Handle fal.ai validation errors with detailed logging
    if (error && typeof error === 'object' && 'status' in error && error.status === 422) {
      const errorBody = (error as any).body || error;
      console.error("🔍 Validation error details:", JSON.stringify(errorBody, null, 2));
      return NextResponse.json(
        { error: 'Invalid image format or parameters. Please try with a different image.' },
        { status: 422 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to generate MonaLisa portrait' },
      { status: 500 }
    );
  }
}
