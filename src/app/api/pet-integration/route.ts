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
    let promptTweak = '';
    let isRegeneration = false;
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
      
      // Server-side image format conversion for fal.ai compatibility
      const convertToJpegIfNeeded = async (file: File): Promise<File> => {
        const problematicFormats = ['image/avif', 'image/heic', 'image/heif'];
        const isHeicByName = file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');
        
        if (problematicFormats.includes(file.type) || isHeicByName) {
          console.log(`🔄 Server-side conversion needed: ${file.name} (${file.type})`);
          
          // For HEIC/HEIF files, attempt server-side conversion using Sharp
          if (file.type === 'image/heic' || file.type === 'image/heif' || isHeicByName) {
            try {
              console.log('🔄 Attempting server-side HEIC conversion with Sharp...');
              
              // Dynamic import to avoid bundling issues
              const sharp = await import('sharp');
              
              // Convert File to Buffer
              const arrayBuffer = await file.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);
              
              // Convert HEIC to JPEG using Sharp
              const jpegBuffer = await sharp.default(buffer)
                .jpeg({ quality: 85 })
                .toBuffer();
              
              // Create new File object
              const newFileName = file.name.replace(/\.(heic|heif)$/i, '.jpg');
              const convertedFile = new File([new Uint8Array(jpegBuffer)], newFileName, {
                type: 'image/jpeg',
                lastModified: file.lastModified
              });
              
              console.log('✅ Server-side HEIC conversion successful:', {
                originalSize: Math.round(file.size / 1024),
                convertedSize: Math.round(convertedFile.size / 1024),
                originalName: file.name,
                convertedName: convertedFile.name
              });
              
              return convertedFile;
              
            } catch (sharpError) {
              console.warn('⚠️ Server-side HEIC conversion failed, trying MIME type fallback:', sharpError);
              
              // Fallback: just change MIME type and hope for the best
              const newName = file.name.replace(/\.(heic|heif)$/i, '.jpg');
              return new File([file], newName, {
                type: 'image/jpeg',
                lastModified: file.lastModified
              });
            }
          }
          
          // For AVIF and other formats, just change MIME type
          let newName = file.name;
          if (file.type === 'image/avif') {
            newName = file.name.replace(/\.avif$/i, '.jpg');
          }
          
          console.log(`🔄 MIME type change: ${file.type} → image/jpeg`);
          return new File([file], newName, {
            type: 'image/jpeg',
            lastModified: file.lastModified
          });
        }
        
        return file;
      };
      
      const processedPortrait = await convertToJpegIfNeeded(portraitFile);
      const processedPet = await convertToJpegIfNeeded(petFile);
      
      portraitUrl = await fal.storage.upload(processedPortrait);
      petUrl = await fal.storage.upload(processedPet);
      console.log("✅ Images uploaded - Portrait:", portraitUrl, "Pet:", petUrl);
    } else {
      // Handle JSON request with image URLs
      const body = await req.json();
      portraitUrl = body.portraitUrl || body.monalisaImageUrl;
      petUrl = body.petUrl || body.petImageUrl;
      
      if (body.artworkId) {
        artworkId = body.artworkId;
      }
      
      if (!portraitUrl || !petUrl) {
        return NextResponse.json({ error: 'Both portraitUrl and petUrl are required' }, { status: 400 });
      }
      
      // Extract prompt tweak for admin regeneration
      promptTweak = body.promptTweak || '';
      isRegeneration = body.isRegeneration || false;
      
      if (isRegeneration && promptTweak) {
        console.log(`🔄 Regeneration mode with prompt tweak: "${promptTweak}"`);
      }
    }

    // Step 2: Add pet to Mona Lisa portrait using Flux Pro Kontext Max Multi
    console.log("🐾 Running pet integration with Flux Pro Kontext Max Multi...");
    
    // Build prompt with optional tweak
    const basePrompt = "Incorporate the pet into the painting of the woman. She is holding it in her lap. Keep the painted style and likeness of the woman and pet";
    const finalPrompt = promptTweak ? `${basePrompt}. ${promptTweak}` : basePrompt;
    
    console.log(`📝 Using prompt: "${finalPrompt}"`);
    
    const result = await fal.subscribe("fal-ai/flux-pro/kontext/max/multi", {
      input: {
        prompt: finalPrompt,
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
      
      // Create admin review for artwork proof (if enabled and not a regeneration)
      if (!isRegeneration) {
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
      } else {
        console.log('🔄 Skipping admin review creation for regeneration');
      }
      
      // Return both URLs - Supabase for storage, fal.ai as fallback
      return NextResponse.json({
        imageUrl: supabaseImageUrl,
        falImageUrl: falImageUrl,
        supabaseUrl: supabaseImageUrl,
        supabaseImageUrl: supabaseImageUrl, // For regeneration API
        falRequestId: result.requestId, // For regeneration API
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
      
      // Check for specific validation errors
      const errorBody = error.body as any;
      if (errorBody?.detail && Array.isArray(errorBody.detail)) {
        console.error("🔍 Validation details:", errorBody.detail.map((detail: any) => ({
          field: detail.loc?.join('.'),
          message: detail.msg,
          type: detail.type,
          input: detail.input
        })));
      }
    }
    
    // Provide more specific error messages for common issues
    let errorMessage = 'Pet integration failed';
    let errorDetails = error instanceof Error ? error.message : 'Unknown error';
    
    if (error && typeof error === 'object' && 'status' in error) {
      if (error.status === 422) {
        const errorBody = (error as any).body;
        if (errorBody?.detail && Array.isArray(errorBody.detail)) {
          const imageLoadErrors = errorBody.detail.filter((detail: any) => detail.type === 'image_load_error');
          if (imageLoadErrors.length > 0) {
            errorMessage = 'fal.ai image loading failed';
            errorDetails = 'fal.ai is having trouble loading images from their storage. This is a temporary infrastructure issue that should resolve automatically. Please try again in a few minutes.';
          } else {
            errorMessage = 'Image format validation failed';
            errorDetails = 'The uploaded images may not be in a supported format. Please try using JPEG or PNG images instead.';
          }
        }
      } else if (error.status === 503) {
        errorMessage = 'fal.ai service temporarily unavailable';
        errorDetails = 'The AI service is temporarily unavailable. Please try again in a few minutes.';
      }
    }
    
    return NextResponse.json(
      { error: errorMessage, details: errorDetails },
      { status: 500 }
    );
  }
}
