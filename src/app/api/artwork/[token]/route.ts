// src/app/api/artwork/[token]/route.ts
import { NextResponse } from 'next/server';
import { getArtworkByToken } from '@/lib/supabase-artworks';

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;
    
    if (!token) {
      return new NextResponse('Token is required', { status: 400 });
    }

    // Get artwork by secure token
    const artwork = await getArtworkByToken(token);
    
    if (!artwork) {
      return new NextResponse('Artwork not found or link expired', { status: 404 });
    }

    // Handle both old and new schema formats
    const generationStep = artwork.generation_step || (artwork as any).generation_status;
    const generatedImageUrl = artwork.generated_images?.artwork_preview || 
                             artwork.generated_images?.artwork_full_res || 
                             (artwork as any).generated_image_url;

    return NextResponse.json({
      success: true,
      artwork: {
        id: artwork.id,
        pet_name: artwork.pet_name,
        customer_name: artwork.customer_name,
        customer_email: artwork.customer_email,
        generated_image_url: generatedImageUrl,
        generation_step: generationStep === 'completed' ? 'completed' : 
                        generationStep === 'failed' ? 'failed' : 'pending',
        generation_status: generationStep === 'completed' ? 'completed' : 
                          generationStep === 'failed' ? 'failed' : 'pending',
        generated_images: artwork.generated_images || {},
        delivery_images: artwork.delivery_images || {},
        mockup_urls: (artwork as any).mockup_urls || {},
        mockup_generated_at: artwork.processing_status?.mockup_generation === 'completed' ? artwork.updated_at : null
      }
    });

  } catch (error) {
    console.error('Error fetching artwork:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
