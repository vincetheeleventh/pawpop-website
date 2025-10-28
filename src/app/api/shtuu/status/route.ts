import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const artworkId = searchParams.get('artworkId');

    if (!artworkId) {
      return NextResponse.json(
        { error: 'Missing artworkId' },
        { status: 400 }
      );
    }

    // Get artwork status
    const { data: artwork, error } = await supabaseAdmin
      .from('artworks')
      .select('id, generation_step, processing_status, generated_images, parody_style')
      .eq('id', artworkId)
      .single();

    if (error || !artwork) {
      return NextResponse.json(
        { error: 'Artwork not found' },
        { status: 404 }
      );
    }

    // Check if complete
    const isComplete = artwork.generation_step === 'completed';
    const isFailed = artwork.generation_step === 'failed';
    const isProcessing = artwork.generation_step === 'generating';

    return NextResponse.json({
      success: true,
      artworkId: artwork.id,
      status: artwork.generation_step,
      isComplete,
      isFailed,
      isProcessing,
      parodyStyle: artwork.parody_style,
      imageUrl: isComplete ? artwork.generated_images?.artwork_preview : null,
      processingStatus: artwork.processing_status,
    });

  } catch (error) {
    console.error('Error in /api/shtuu/status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
