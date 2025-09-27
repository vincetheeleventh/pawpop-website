import { NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';
import { updateArtworkUpscaleStatus, getArtworkById } from '@/lib/supabase-artworks';

// Configure fal client
fal.config({
  credentials: process.env.FAL_KEY || process.env.HF_TOKEN
});

export async function POST(req: NextRequest) {
  let artworkId: string | undefined;
  
  try {
    const requestData = await req.json();
    artworkId = requestData.artworkId;

    if (!artworkId) {
      return NextResponse.json({ error: 'Artwork ID is required' }, { status: 400 });
    }

    // Get artwork details
    const artwork = await getArtworkById(artworkId);
    if (!artwork) {
      return NextResponse.json({ error: 'Artwork not found' }, { status: 404 });
    }

    const generatedImageUrl = artwork.generated_images?.artwork_preview || artwork.generated_images?.artwork_full_res;
    if (!generatedImageUrl) {
      return NextResponse.json({ error: 'No generated image to upscale' }, { status: 400 });
    }

    // Check if already upscaled using new schema
    if (artwork.processing_status?.upscaling === 'completed' && artwork.generated_images?.artwork_full_res) {
      return NextResponse.json({ 
        success: true, 
        upscaled_image_url: artwork.generated_images.artwork_full_res,
        message: 'Already upscaled'
      });
    }

    // Update status to processing
    await updateArtworkUpscaleStatus(artworkId, 'processing');

    console.log(`🔍 Starting upscaling for artwork ${artworkId} with image: ${generatedImageUrl}`);

    // Upscale the image using fal.ai clarity-upscaler
    const result = await fal.subscribe("fal-ai/clarity-upscaler", {
      input: {
        image_url: generatedImageUrl,
        prompt: "masterpiece, best quality, highres, visible paintstroke texture, oil painting style",
        upscale_factor: 3,
        negative_prompt: "(worst quality, low quality, normal quality:2), blurry, pixelated, artifacts",
        creativity: 0.35,
        resemblance: 0.8,
        guidance_scale: 4,
        num_inference_steps: 18,
        enable_safety_checker: true
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          update.logs.map((log) => log.message).forEach(console.log);
        }
      },
    });

    console.log(`✅ Upscaling completed for artwork ${artworkId}`);

    // Update artwork with upscaled image URL and mark as completed
    await updateArtworkUpscaleStatus(artworkId, 'completed', result.data.image.url);

    return NextResponse.json({
      success: true,
      upscaled_image_url: result.data.image.url,
      request_id: result.requestId
    });

  } catch (error) {
    console.error('❌ Upscaling failed:', error);
    
    // Update status to failed if we have artworkId
    if (artworkId) {
      try {
        await updateArtworkUpscaleStatus(artworkId, 'failed');
      } catch (updateError) {
        console.error('Failed to update artwork status:', updateError);
      }
    }

    return NextResponse.json(
      { 
        error: 'Upscaling failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }, 
      { status: 500 }
    );
  }
}

// GET endpoint to check upscaling status
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const artworkId = searchParams.get('artworkId');

    if (!artworkId) {
      return NextResponse.json({ error: 'Artwork ID is required' }, { status: 400 });
    }

    const artwork = await getArtworkById(artworkId);
    if (!artwork) {
      return NextResponse.json({ error: 'Artwork not found' }, { status: 404 });
    }

    return NextResponse.json({
      upscale_status: artwork.processing_status?.upscaling || 'not_started',
      upscaled_image_url: artwork.generated_images?.artwork_full_res || null,
      upscaled_at: artwork.generation_metadata?.upscale_completed_at || null
    });

  } catch (error) {
    console.error('Error checking upscale status:', error);
    return NextResponse.json(
      { error: 'Failed to check upscale status' }, 
      { status: 500 }
    );
  }
}
