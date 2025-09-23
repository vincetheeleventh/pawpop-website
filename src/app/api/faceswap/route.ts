// src/app/api/faceswap/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { performFaceSwap } from '@/lib/viewcomfy';
import { storeFalImageInSupabase } from '@/lib/supabase-storage';

export async function POST(req: NextRequest) {
  try {
    console.log("👤 FaceSwap - Step 1.5: Face replacement using ViewComfy");
    
    let sourceImageUrl: string; // Pet mom photo
    let targetImageUrl: string; // MonaLisa portrait
    let artworkId = `temp_${Date.now()}`;
    const contentType = req.headers.get('content-type');

    if (contentType?.includes('multipart/form-data')) {
      // Handle file uploads (if needed)
      const formData = await req.formData();
      const sourceFile = formData.get('sourceImage') as File;
      const targetFile = formData.get('targetImage') as File;
      
      if (!sourceFile || !targetFile) {
        return NextResponse.json({ 
          error: 'Both sourceImage and targetImage files are required' 
        }, { status: 400 });
      }

      // Extract artwork ID from form data if available
      const artworkIdFromForm = formData.get('artworkId') as string;
      if (artworkIdFromForm) {
        artworkId = artworkIdFromForm;
      }

      // For file uploads, you'd need to upload to a temporary storage first
      // This is a simplified version - in practice you might want to upload to fal.ai storage
      throw new Error('File upload not implemented for faceswap - use URL-based approach');
      
    } else {
      // Handle JSON request with image URLs (recommended approach)
      const body = await req.json();
      sourceImageUrl = body.sourceImageUrl; // Pet mom photo
      targetImageUrl = body.targetImageUrl; // MonaLisa portrait
      
      if (body.artworkId) {
        artworkId = body.artworkId;
      }
      
      if (!sourceImageUrl || !targetImageUrl) {
        return NextResponse.json({ 
          error: 'Both sourceImageUrl and targetImageUrl are required' 
        }, { status: 400 });
      }
    }

    console.log("📊 FaceSwap input details:", {
      artworkId,
      hasSourceImage: !!sourceImageUrl,
      hasTargetImage: !!targetImageUrl,
      sourceImageUrl: sourceImageUrl?.substring(0, 50) + '...',
      targetImageUrl: targetImageUrl?.substring(0, 50) + '...'
    });

    // Perform the faceswap using ViewComfy
    console.log("🔄 Running faceswap with ViewComfy...");
    const faceswapImageUrl = await performFaceSwap({
      sourceImageUrl,
      targetImageUrl,
      artworkId
    });

    console.log("✅ FaceSwap completed successfully!");
    
    // Store the faceswap result in Supabase Storage for easier access
    try {
      const supabaseImageUrl = await storeFalImageInSupabase(
        faceswapImageUrl, 
        artworkId, 
        'faceswap_result'
      );
      
      console.log(`📁 FaceSwap image stored in Supabase: ${supabaseImageUrl}`);
      
      // Return both URLs - Supabase for storage, ViewComfy as fallback
      return NextResponse.json({
        imageUrl: supabaseImageUrl,
        viewcomfyUrl: faceswapImageUrl,
        supabaseUrl: supabaseImageUrl,
        success: true
      });
      
    } catch (storageError) {
      console.warn('⚠️ Supabase storage failed for faceswap, using ViewComfy URL:', storageError);
      
      // Fallback to ViewComfy URL if Supabase storage fails
      return NextResponse.json({
        imageUrl: faceswapImageUrl,
        success: true
      });
    }

  } catch (error) {
    console.error("❌ FaceSwap error:", error);
    
    // Handle ViewComfy-specific errors
    if (error && typeof error === 'object' && 'message' in error) {
      const errorMessage = (error as Error).message;
      
      if (errorMessage.includes('ViewComfy API error')) {
        return NextResponse.json(
          { error: 'FaceSwap service temporarily unavailable. Please try again.' },
          { status: 503 }
        );
      }
      
      if (errorMessage.includes('Missing ViewComfy configuration')) {
        return NextResponse.json(
          { error: 'FaceSwap service not configured properly.' },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: 'FaceSwap failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
