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
      
      // Log file types for debugging
      console.log(`📁 Portrait file: ${portraitFile.name} (${portraitFile.type})`);
      console.log(`📁 Pet file: ${petFile.name} (${petFile.type})`);
      
      // For now, let's try uploading with forced JPEG MIME type for AVIF files
      const forceJpegMimeType = (file: File): File => {
        if (file.type === 'image/avif') {
          console.log(`🔄 Forcing MIME type change: ${file.type} → image/jpeg`);
          return new File([file], file.name.replace(/\.avif$/i, '.jpg'), {
            type: 'image/jpeg',
            lastModified: file.lastModified
          });
        }
        return file;
      };
      
      const processedPortrait = forceJpegMimeType(portraitFile);
      const processedPet = forceJpegMimeType(petFile);
      
      portraitUrl = await fal.storage.upload(processedPortrait);
      petUrl = await fal.storage.upload(processedPet);
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
        guidance_scale: 3.0,
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
      
      // Create admin review for artwork proof (if enabled)
      try {
        const { createAdminReview, isHumanReviewEnabled } = await import('@/lib/admin-review');
        const { supabaseAdmin } = await import('@/lib/supabase');
        
        if (isHumanReviewEnabled() && supabaseAdmin) {
          console.log('🔍 Creating admin review for artwork proof...');
          
          // Get artwork details for the review
          const { data: artwork } = await supabaseAdmin
            .from('artworks')
            .select('customer_name, customer_email, pet_name')
            .eq('id', artworkId)
            .single();
          
          if (artwork) {
            await createAdminReview({
              artwork_id: artworkId,
              review_type: 'artwork_proof',
              image_url: supabaseImageUrl,
              fal_generation_url: falImageUrl,
              customer_name: artwork.customer_name,
              customer_email: artwork.customer_email,
              pet_name: artwork.pet_name
            });
            
            console.log('✅ Admin review created successfully');
          }
        }
      } catch (reviewError) {
        console.warn('⚠️ Failed to create admin review:', reviewError);
        // Don't fail the main process if review creation fails
      }
      
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
    
    // Log detailed fal.ai validation errors
    if (error && typeof error === 'object' && 'body' in error) {
      console.error("🔍 Detailed fal.ai error:", JSON.stringify(error.body, null, 2));
    }
    
    return NextResponse.json(
      { error: 'Pet integration failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
