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

  // Enhanced logging for production debugging
  const logContext = {
    requestId,
    timestamp: new Date().toISOString(),
    userAgent: req.headers.get('user-agent'),
    contentType: req.headers.get('content-type'),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: !!process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL_REGION: process.env.VERCEL_REGION,
      falKeyConfigured: !!process.env.FAL_KEY,
      hfTokenConfigured: !!process.env.HF_TOKEN,
      falKeyLength: process.env.FAL_KEY?.length || 0,
      hfTokenLength: process.env.HF_TOKEN?.length || 0
    }
  };

  try {
    console.log("🎨 MonaLisa Maker - Step 1: Portrait Transformation [v2.0]");
    console.log("📊 Request Context:", JSON.stringify(logContext, null, 2));
    
    let imageUrl: string;
    let imageFile: File | null = null;
    let artworkId = `temp_${Date.now()}`;
    const contentType = req.headers.get('content-type');

    if (contentType?.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await req.formData();
      imageFile = formData.get('image') as File;

      if (!imageFile) {
        console.error("❌ No image file provided in FormData");
        return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
      }

      // Extract artwork ID from form data if available
      const artworkIdFromForm = formData.get('artworkId') as string;
      if (artworkIdFromForm) {
        artworkId = artworkIdFromForm;
      }

      // Enhanced file logging for debugging
      console.log("📊 File Upload Details:", {
        requestId,
        fileName: imageFile.name,
        fileSize: imageFile.size,
        fileSizeMB: (imageFile.size / 1024 / 1024).toFixed(2) + ' MB',
        fileType: imageFile.type,
        artworkId,
        formDataKeys: Array.from(formData.keys())
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
      const uploadStartTime = Date.now();

      try {
        const uploadResult = await fal.storage.upload(imageFile);

        // Detailed upload result logging
        console.log("📦 fal.storage.upload result:", {
          requestId,
          uploadTimeMs: Date.now() - uploadStartTime,
          resultType: typeof uploadResult,
          resultIsObject: uploadResult && typeof uploadResult === 'object',
          resultIsString: typeof uploadResult === 'string',
          resultKeys: uploadResult && typeof uploadResult === 'object' ? Object.keys(uploadResult) : 'N/A',
          resultStringified: JSON.stringify(uploadResult).substring(0, 500) + (JSON.stringify(uploadResult).length > 500 ? '...' : '')
        });

        // Log environment info for debugging
        console.log("🔍 Environment check:", {
          requestId,
          isProduction: process.env.NODE_ENV === 'production',
          isVercel: !!process.env.VERCEL,
          falKeyLength: process.env.FAL_KEY?.length || 0,
          hfTokenLength: process.env.HF_TOKEN?.length || 0
        });

        // Handle multiple possible response formats from fal.ai
        let extractedUrl: string | undefined;

        if (typeof uploadResult === 'string') {
          // Direct string URL
          extractedUrl = uploadResult;
          console.log("✅ Direct string URL found:", { requestId, extractedUrl });
        } else if (uploadResult && typeof uploadResult === 'object') {
          // Try common property names for URLs
          const possibleUrlProps = ['url', 'file_url', 'download_url', 'public_url', 'data_url', 'href', 'link', 'fileUrl', 'downloadUrl', 'publicUrl'];

          console.log("🔍 Searching for URL in object properties:", {
            requestId,
            availableProperties: Object.keys(uploadResult),
            tryingProperties: possibleUrlProps
          });

          for (const prop of possibleUrlProps) {
            if (prop in uploadResult && typeof (uploadResult as any)[prop] === 'string') {
              extractedUrl = (uploadResult as any)[prop];
              console.log(`✅ Found URL in property '${prop}':`, { requestId, extractedUrl });
              break;
            }
          }

          // If no direct URL property, check nested data object
          if (!extractedUrl && 'data' in uploadResult && (uploadResult as any).data && typeof (uploadResult as any).data === 'object') {
            const dataObj = (uploadResult as any).data;
            console.log("🔍 Checking nested 'data' object for URL properties");
            for (const prop of possibleUrlProps) {
              if (prop in dataObj && typeof dataObj[prop] === 'string') {
                extractedUrl = dataObj[prop];
                console.log(`✅ Found URL in data.${prop}:`, { requestId, extractedUrl });
                break;
              }
            }
          }

          // If still no URL found, check if the entire object is actually a URL-like object
          if (!extractedUrl) {
            // Check if the object itself might be the URL (some APIs return objects that stringify to URLs)
            const objString = String(uploadResult);
            if (objString.startsWith('http') && objString !== '[object Object]') {
              extractedUrl = objString;
              console.log(`✅ Found URL by stringifying object:`, { requestId, extractedUrl });
            } else {
              console.log("❌ Object stringified to:", { requestId, objString, isValidUrl: objString.startsWith('http') });
            }
          }

          // If still no URL found, log the full object for debugging
          if (!extractedUrl) {
            console.error("❌ Could not extract URL from upload result:", {
              requestId,
              uploadResult: JSON.stringify(uploadResult, null, 2),
              uploadResultType: typeof uploadResult,
              uploadResultConstructor: (uploadResult as any)?.constructor?.name,
              uploadResultPrototype: Object.getPrototypeOf(uploadResult)?.constructor?.name
            });

            // Try one more approach - check if any property contains a URL-like string
            console.log("🔍 Searching all properties for URL-like strings...");
            for (const [key, value] of Object.entries(uploadResult as any)) {
              if (typeof value === 'string' && value.startsWith('http')) {
                extractedUrl = value;
                console.log(`✅ Found URL in property '${key}':`, { requestId, extractedUrl });
                break;
              }
            }
          }
        } else {
          console.error("❌ Unexpected upload result format:", {
            requestId,
            uploadResult,
            uploadResultType: typeof uploadResult,
            uploadResultString: String(uploadResult)
          });
          throw new Error(`Unexpected upload result format: ${typeof uploadResult}`);
        }

        // Final validation - ensure we have a valid string URL
        if (!extractedUrl || typeof extractedUrl !== 'string') {
          console.error("❌ No valid URL extracted from upload result:", {
            extractedUrl,
            type: typeof extractedUrl,
            uploadResult: JSON.stringify(uploadResult, null, 2)
          });
          throw new Error(`No valid URL found in upload response. Available properties: ${Object.keys(uploadResult).join(', ')}`);
        }

        // Ensure the URL is a proper HTTP/HTTPS URL
        if (!extractedUrl.startsWith('http://') && !extractedUrl.startsWith('https://')) {
          console.error("❌ Invalid URL format:", extractedUrl);
          throw new Error(`Invalid URL format: ${extractedUrl}`);
        }

        // Double-check: ensure extractedUrl is not the uploadResult object itself
        if (extractedUrl === uploadResult) {
          console.error("❌ BUG: extractedUrl is the same as uploadResult object!");
          throw new Error("URL extraction failed - got the entire upload result object instead of a URL string");
        }

        imageUrl = extractedUrl;
        console.log("✅ Image uploaded, extracted URL:", { requestId, imageUrl });

      } catch (uploadError) {
        console.error("❌ fal.storage.upload failed:", {
          requestId,
          error: uploadError,
          errorMessage: uploadError instanceof Error ? uploadError.message : 'Unknown error',
          errorStack: uploadError instanceof Error ? uploadError.stack : undefined,
          errorType: uploadError?.constructor?.name
        });

        // Fallback: Try to use the image file directly without fal.ai storage
        console.log("🔄 Attempting fallback: using image file directly...");

        try {
          // For fallback, we'll use a data URL approach or try to upload to a different service
          // For now, let's try to convert the file to a data URL as a last resort
          const fileBuffer = await imageFile.arrayBuffer();
          const base64 = Buffer.from(fileBuffer).toString('base64');
          const mimeType = imageFile.type || 'image/jpeg';
          const dataUrl = `data:${mimeType};base64,${base64}`;

          console.log("✅ Fallback: Created data URL for image file", {
            requestId,
            dataUrlLength: dataUrl.length,
            mimeType,
            isDataUrl: dataUrl.startsWith('data:')
          });
          imageUrl = dataUrl;
          console.log("📎 Using fallback data URL for image file");

        } catch (fallbackError) {
          console.error("❌ Fallback also failed:", {
            requestId,
            fallbackError,
            fallbackErrorMessage: fallbackError instanceof Error ? fallbackError.message : 'Unknown error',
            fallbackErrorStack: fallbackError instanceof Error ? fallbackError.stack : undefined,
            originalUploadError: uploadError instanceof Error ? uploadError.message : 'Unknown error'
          });
          throw new Error(`Failed to upload image to fal.ai storage and fallback failed: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
        }
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
        console.error("❌ No imageUrl provided in request body", { requestId, body });
        return NextResponse.json({ error: 'No imageUrl provided in request body' }, { status: 400 });
      }

      if (typeof imageUrl !== 'string') {
        console.error('❌ Invalid imageUrl type received:', {
          requestId,
          imageUrl,
          type: typeof imageUrl,
          body: JSON.stringify(body, null, 2)
        });
        return NextResponse.json({
          error: `Invalid imageUrl type: expected string, got ${typeof imageUrl}. Value: ${JSON.stringify(imageUrl)}`
        }, { status: 400 });
      }

      console.log("🔗 Using provided image URL:", { requestId, imageUrl });
    }

    // Validate that we have either an image file or imageUrl
    if (!imageFile && (!imageUrl || typeof imageUrl !== 'string')) {
      console.error("❌ No valid image input:", {
        hasImageFile: !!imageFile,
        imageUrl: imageUrl,
        imageUrlType: typeof imageUrl
      });
      throw new Error(`No valid image input: need either image file or valid imageUrl`);
    }

    // Additional validation for imageUrl to ensure it's always a string
    if (imageUrl && typeof imageUrl !== 'string') {
      console.error("❌ imageUrl is not a string:", {
        imageUrl,
        type: typeof imageUrl,
        constructor: imageUrl && typeof imageUrl === 'object' ? (imageUrl as any)?.constructor?.name : 'N/A'
      });
      throw new Error(`Invalid imageUrl type: expected string, got ${typeof imageUrl}`);
    }

    // Ensure imageUrl is a valid HTTP/HTTPS URL
    if (imageUrl && !imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
      console.error("❌ Invalid imageUrl format:", imageUrl);
      throw new Error(`Invalid imageUrl format: ${imageUrl}`);
    }

    if (imageFile) {
      console.log("📎 Using direct image file:", imageFile.name);
    } else {
      console.log("🔗 Using image URL:", imageUrl);
    }

    // Step 1: Transform user photo into Mona Lisa portrait
    console.log("🎨 Running MonaLisa Maker transformation...", {
      requestId,
      artworkId,
      imageUrlType: typeof imageUrl,
      imageUrlPreview: imageUrl.substring(0, 100) + (imageUrl.length > 100 ? '...' : ''),
      imageUrlLength: imageUrl.length
    });

    // Use image file directly if we have FormData, otherwise use image_url
    const falInput: any = {
      prompt: "keep likeness and hairstyle the same, change pose and style to mona lisa",
      loras: [{
        path: "https://v3.fal.media/files/koala/HV-XcuBOG0z0apXA9dzP7_adapter_model.safetensors",
        scale: 1.0
      }],
      resolution_mode: "2:3" as const,
      guidance_scale: 2.5,
      num_inference_steps: 28,
      seed: Math.floor(Math.random() * 1000000)
    };

    if (imageFile) {
      // Use direct file upload for FormData
      console.log("📎 Using direct image file upload to fal.ai");

      // Check if we're using a data URL (fallback) and warn about potential issues
      if (imageUrl.startsWith('data:')) {
        console.warn("⚠️ Using data URL fallback - this may not work reliably with fal.ai API", {
          requestId,
          dataUrlLength: imageUrl.length,
          isDataUrl: true
        });

        // Data URLs can be very long and may cause issues with APIs
        // For now, we'll try it but log a warning
        if (imageUrl.length > 100000) { // ~100KB as base64
          console.error("❌ Data URL is too long:", { requestId, length: imageUrl.length });
          throw new Error("Image file is too large to convert to data URL. Please try a smaller image.");
        }
      }

      // Final safety check: ensure imageUrl is not an object
      if (typeof imageUrl === 'object') {
        console.error("❌ CRITICAL BUG: imageUrl is still an object before fal.ai call:", {
          requestId,
          imageUrl,
          type: typeof imageUrl,
          constructor: imageUrl && typeof imageUrl === 'object' ? (imageUrl as any)?.constructor?.name : 'N/A',
          toString: String(imageUrl)
        });
        throw new Error("imageUrl is an object instead of a string - this indicates a bug in URL extraction");
      }

      falInput.image_url = imageUrl;
      console.log("📤 Sending to fal.ai generation:", {
        requestId,
        imageUrlType: 'string',
        imageUrlLength: imageUrl.length,
        imageUrlPreview: imageUrl.substring(0, 100) + '...',
        falInputKeys: Object.keys(falInput)
      });
    } else {
      // Use image URL for JSON requests
      console.log("🔗 Using image URL for fal.ai");
      falInput.image_url = imageUrl;
    }

    const generationStartTime = Date.now();
    console.log("📡 Starting fal.ai generation...", { requestId, generationStartTime });

    const stream = await fal.stream('fal-ai/flux-kontext-lora', {
      input: falInput
    });

    console.log("📡 Processing MonaLisa transformation...", { requestId });
    let eventCount = 0;
    for await (const event of stream) {
      eventCount++;
      // Only log event type, not the full event data to avoid giant hashes
      const eventType = (event as any).type;
      if (eventType && eventType !== 'logs') {
        console.log("📝 Stream event:", { requestId, eventType, eventNumber: eventCount });
      }
    }

    const result = await stream.done();
    const generationTime = Date.now() - generationStartTime;

    if (!result || !result.images || !result.images[0]) {
      console.error("❌ No Mona Lisa portrait generated:", {
        requestId,
        result,
        hasImages: !!result?.images,
        imagesLength: result?.images?.length || 0,
        generationTime
      });
      throw new Error("No Mona Lisa portrait generated");
    }

    console.log("✅ MonaLisa Maker transformation complete!", {
      requestId,
      generationTime,
      resultImagesCount: result.images.length,
      hasImageUrl: !!result.images[0].url,
      imageUrl: result.images[0].url
    });
    
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
      
      const totalTime = Date.now() - startTime;
      console.log("✅ MonaLisa Maker completed successfully:", {
        requestId,
        totalTime,
        artworkId,
        imageUrls: {
          supabase: supabaseImageUrl,
          fal: falImageUrl
        },
        generationTime,
        logContext
      });

      // Return both URLs - Supabase for storage, fal.ai as fallback
      return NextResponse.json({
        imageUrl: supabaseImageUrl,
        falImageUrl: falImageUrl,
        supabaseUrl: supabaseImageUrl,
        success: true
      });
      
    } catch (storageError) {
      console.warn('⚠️ Supabase storage failed, using fal.ai URL:', {
        requestId,
        storageError: storageError instanceof Error ? storageError.message : 'Unknown error',
        falImageUrl
      });
      
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
    const totalTime = Date.now() - startTime;
    console.error("❌ MonaLisa Maker error:", {
      requestId,
      error: error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
      errorType: error?.constructor?.name,
      totalTime,
      logContext
    });
    
    // Track failed fal.ai usage
    await trackFalAiUsage({
      endpoint: 'monalisa-maker',
      requestId,
      status: 'error',
      responseTime: totalTime,
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    });
    
    // Handle fal.ai validation errors with detailed logging
    if (error && typeof error === 'object' && 'status' in error && error.status === 422) {
      const errorBody = (error as any).body || error;
      console.error("🔍 Validation error details:", {
        requestId,
        errorBody: JSON.stringify(errorBody, null, 2),
        totalTime
      });
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
