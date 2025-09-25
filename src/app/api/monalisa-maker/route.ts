import { NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';
import { trackFalAiUsage } from '@/lib/monitoring';

// Configure fal client
fal.config({
  credentials: process.env.FAL_KEY || process.env.HF_TOKEN
});

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const requestId = `monalisa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log("🎨 MonaLisa Maker - Step 1: Portrait Transformation [v2.0]");
    
    let imageUrl: string;
    let artworkId = `temp_${Date.now()}`;
    const contentType = req.headers.get('content-type');

    if (contentType?.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await req.formData();
      const imageFile = formData.get('image') as File;
      
      if (!imageFile) {
        return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
      }

      // Extract artwork ID from form data if available
      const artworkIdFromForm = formData.get('artworkId') as string;
      if (artworkIdFromForm) {
        artworkId = artworkIdFromForm;
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
      try {
        const uploadResult = await fal.storage.upload(imageFile);
        console.log("📦 Upload result type:", typeof uploadResult);
        console.log("📦 Upload result keys:", uploadResult && typeof uploadResult === 'object' ? Object.keys(uploadResult) : 'N/A');
        console.log("📦 Upload result (truncated):", JSON.stringify(uploadResult).substring(0, 200) + '...');
        
        // Handle multiple possible response formats from fal.ai
        let extractedUrl: string | undefined;
        
        if (typeof uploadResult === 'string') {
          // Direct string URL
          extractedUrl = uploadResult;
        } else if (uploadResult && typeof uploadResult === 'object') {
          // Try common property names for URLs
          const possibleUrlProps = ['url', 'file_url', 'download_url', 'public_url', 'data_url', 'href', 'link'];
          
          for (const prop of possibleUrlProps) {
            if (prop in uploadResult && typeof (uploadResult as any)[prop] === 'string') {
              extractedUrl = (uploadResult as any)[prop];
              console.log(`✅ Found URL in property '${prop}':`, extractedUrl);
              break;
            }
          }
          
          // If no direct URL property, check nested data object
          if (!extractedUrl && 'data' in uploadResult && (uploadResult as any).data && typeof (uploadResult as any).data === 'object') {
            const dataObj = (uploadResult as any).data;
            for (const prop of possibleUrlProps) {
              if (prop in dataObj && typeof dataObj[prop] === 'string') {
                extractedUrl = dataObj[prop];
                console.log(`✅ Found URL in data.${prop}:`, extractedUrl);
                break;
              }
            }
          }
          
          // If still no URL found, log the full object for debugging
          if (!extractedUrl) {
            console.error("❌ Could not extract URL from upload result:", JSON.stringify(uploadResult, null, 2));
            throw new Error(`No valid URL found in upload response. Available properties: ${Object.keys(uploadResult).join(', ')}`);
          }
        } else {
          console.error("❌ Unexpected upload result format:", uploadResult);
          throw new Error(`Unexpected upload result format: ${typeof uploadResult}`);
        }
        
        // Assign the extracted URL to imageUrl
        imageUrl = extractedUrl;
        console.log("✅ Image uploaded, extracted URL:", imageUrl);
        
        if (!imageUrl || typeof imageUrl !== 'string') {
          throw new Error(`Invalid URL extracted: ${imageUrl} (type: ${typeof imageUrl})`);
        }
        
        // Validate URL format
        if (!imageUrl.startsWith('http')) {
          throw new Error(`Invalid URL format: ${imageUrl}`);
        }
        
      } catch (uploadError) {
        console.error("❌ fal.storage.upload failed:", uploadError);
        throw new Error(`Failed to upload image to fal.ai storage: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
      }
    } else {
      // Handle JSON request with image URL
      const body = await req.json();
      imageUrl = body.imageUrl;
      
      if (body.artworkId) {
        artworkId = body.artworkId;
      }
      
      // Enhanced validation for imageUrl
      if (!imageUrl) {
        return NextResponse.json({ error: 'No imageUrl provided in request body' }, { status: 400 });
      }
      
      if (typeof imageUrl !== 'string') {
        console.error('❌ Invalid imageUrl type received:', {
          imageUrl,
          type: typeof imageUrl,
          body: JSON.stringify(body, null, 2)
        });
        return NextResponse.json({ 
          error: `Invalid imageUrl type: expected string, got ${typeof imageUrl}. Value: ${JSON.stringify(imageUrl)}` 
        }, { status: 400 });
      }
    }

    // Validate imageUrl before calling fal.ai API
    if (!imageUrl || typeof imageUrl !== 'string') {
      throw new Error(`Invalid imageUrl: ${imageUrl} (type: ${typeof imageUrl})`);
    }
    
    console.log("🔗 Using image URL:", imageUrl);

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
    
    // Store the image in Supabase Storage for easier access
    const falImageUrl = result.images[0].url;
    
    try {
      // Import storage utilities dynamically to avoid build issues
      const { storeFalImageInSupabase } = await import('@/lib/supabase-storage');
      
      const supabaseImageUrl = await storeFalImageInSupabase(
        falImageUrl, 
        artworkId, 
        'monalisa_base'
      );
      
      console.log(`📁 Image stored in Supabase: ${supabaseImageUrl}`);
      
      // Track successful fal.ai usage
      await trackFalAiUsage({
        endpoint: 'monalisa-maker',
        requestId,
        status: 'success',
        responseTime: Date.now() - startTime,
        cost: 0.05 // Estimated cost for MonaLisa generation
      });
      
      // Return both URLs - Supabase for storage, fal.ai as fallback
      return NextResponse.json({
        imageUrl: supabaseImageUrl,
        falImageUrl: falImageUrl,
        supabaseUrl: supabaseImageUrl,
        success: true
      });
      
    } catch (storageError) {
      console.warn('⚠️ Supabase storage failed, using fal.ai URL:', storageError);
      
      // Track successful fal.ai usage (even with storage failure)
      await trackFalAiUsage({
        endpoint: 'monalisa-maker',
        requestId,
        status: 'success',
        responseTime: Date.now() - startTime,
        cost: 0.05 // Estimated cost for MonaLisa generation
      });
      
      // Fallback to fal.ai URL if Supabase storage fails
      return NextResponse.json({
        imageUrl: falImageUrl,
        success: true
      });
    }

  } catch (error) {
    console.error("❌ MonaLisa Maker error:", error);
    
    // Track failed fal.ai usage
    await trackFalAiUsage({
      endpoint: 'monalisa-maker',
      requestId,
      status: 'error',
      responseTime: Date.now() - startTime,
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    });
    
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
