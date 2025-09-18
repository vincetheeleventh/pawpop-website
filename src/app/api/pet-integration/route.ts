import { NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';

// Configure fal client
fal.config({
  credentials: process.env.FAL_KEY || process.env.HF_TOKEN
});

export async function POST(req: NextRequest) {
  try {
    console.log("🐾 Pet Integration - Step 2: Adding pets to Mona Lisa portrait");
    
    let portraitUrl: string;
    let petUrl: string;
    let artworkId = `temp_${Date.now()}`;
    const contentType = req.headers.get('content-type');

    if (contentType?.includes('multipart/form-data')) {
      // Handle file uploads
      const formData = await req.formData();
      const portraitFile = formData.get('portrait') as File;
      const petFile = formData.get('pet') as File;
      
      if (!portraitFile || !petFile) {
        return NextResponse.json({ error: 'Both portrait and pet images are required' }, { status: 400 });
      }

      // Extract artwork ID from form data if available
      const artworkIdFromForm = formData.get('artworkId') as string;
      if (artworkIdFromForm) {
        artworkId = artworkIdFromForm;
      }

      console.log("☁️ Uploading images to fal storage...");
      portraitUrl = await fal.storage.upload(portraitFile);
      petUrl = await fal.storage.upload(petFile);
      console.log("✅ Images uploaded - Portrait:", portraitUrl, "Pet:", petUrl);
    } else {
      // Handle JSON request with image URLs
      const body = await req.json();
      portraitUrl = body.portraitUrl;
      petUrl = body.petUrl;
      
      if (body.artworkId) {
        artworkId = body.artworkId;
      }
      
      if (!portraitUrl || !petUrl) {
        return NextResponse.json({ error: 'Both portraitUrl and petUrl are required' }, { status: 400 });
      }
    }

    // Step 2: Add pet to Mona Lisa portrait using Flux Pro Kontext Max Multi
    console.log("🐾 Running pet integration with Flux Pro Kontext Max Multi...");
    const result = await fal.subscribe("fal-ai/flux-pro/kontext/max/multi", {
      input: {
        prompt: "Incorporate the pet into the painting of the woman. She is holding it in her lap. Keep the painted style and likeness of the woman and pet",
        guidance_scale: 2.5,
        num_images: 1,
        output_format: "jpeg",
        safety_tolerance: "2",
        image_urls: [portraitUrl, petUrl],
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

    console.log("✅ Pet integration complete!");
    console.log("📊 Result data:", result.data);
    console.log("🆔 Request ID:", result.requestId);

    if (!result.data || !result.data.images || !result.data.images[0]) {
      throw new Error("No final portrait with pets generated");
    }

    // Store the final image in Supabase Storage
    const falImageUrl = result.data.images[0].url;
    
    try {
      // Import storage utilities dynamically to avoid build issues
      const { storeFalImageInSupabase } = await import('@/lib/supabase-storage');
      
      const supabaseImageUrl = await storeFalImageInSupabase(
        falImageUrl, 
        artworkId, 
        'artwork_final'
      );
      
      console.log(`📁 Final artwork stored in Supabase: ${supabaseImageUrl}`);
      
      // Return both URLs - Supabase for storage, fal.ai as fallback
      return NextResponse.json({
        imageUrl: supabaseImageUrl,
        falImageUrl: falImageUrl,
        supabaseUrl: supabaseImageUrl,
        success: true,
        requestId: result.requestId
      });
      
    } catch (storageError) {
      console.warn('⚠️ Supabase storage failed for final artwork, using fal.ai URL:', storageError);
      
      // Fallback to fal.ai URL if Supabase storage fails
      return NextResponse.json({
        imageUrl: falImageUrl,
        success: true,
        requestId: result.requestId
      });
    }

  } catch (error) {
    console.error("❌ Pet integration error:", error);
    return NextResponse.json(
      { error: 'Pet integration failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
