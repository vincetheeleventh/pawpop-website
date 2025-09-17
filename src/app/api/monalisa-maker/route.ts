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
      console.log("📝 Stream event:", (event as any).type || 'processing');
    }

    const result = await stream.done();

    if (!result || !result.images || !result.images[0]) {
      throw new Error("No Mona Lisa portrait generated");
    }

    console.log("✅ MonaLisa Maker transformation complete!");
    
    // Fetch the generated image
    const imageResponse = await fetch(result.images[0].url);
    const imageBuffer = await imageResponse.arrayBuffer();

    return new NextResponse(Buffer.from(imageBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store',
        'X-Generated-Image-URL': result.images[0].url
      }
    });

  } catch (error) {
    console.error("❌ MonaLisa Maker error:", error);
    return NextResponse.json(
      { error: 'MonaLisa Maker transformation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
