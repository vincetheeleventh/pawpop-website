import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { fal } from '@fal-ai/client';

// Configure fal.ai
fal.config({
  credentials: process.env.FAL_KEY || process.env.HF_TOKEN,
});

// Parody style prompts for Shtuu's artwork
const PARODY_PROMPTS: Record<string, string> = {
  wizard: 'A magical wizard portrait in the style of a prestigious wizarding school, featuring a [PET_TYPE] wearing wizard robes and a pointed hat, set in an ornate golden frame with magical elements, dramatic lighting, oil painting style, highly detailed',
  paws: 'Movie poster in the iconic Jaws style, featuring a [PET_TYPE] emerging from water with dramatic lighting, bold typography "PAWS" at the top, vintage 1970s movie poster aesthetic, high contrast, cinematic',
  popstar: 'Album cover in the iconic Michael Jackson Thriller style, featuring a [PET_TYPE] in a red leather jacket with dramatic pose, 1980s aesthetic, bold colors, high contrast, professional photography style',
  dogfather: 'A dramatic mafia boss portrait featuring a [PET_TYPE] in a dark suit with dramatic side lighting, inspired by The Godfather movie poster, oil painting style, dark moody atmosphere, highly detailed, cinematic',
};

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    if (!process.env.FAL_KEY && !process.env.HF_TOKEN) {
      console.error('❌ FAL_KEY or HF_TOKEN not configured');
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 500 }
      );
    }

    const { artworkId, parodyStyle } = await request.json();

    if (!artworkId) {
      return NextResponse.json(
        { error: 'Missing artworkId' },
        { status: 400 }
      );
    }

    // Get artwork record
    const { data: artwork, error: artworkError } = await supabaseAdmin
      .from('artworks')
      .select('*')
      .eq('id', artworkId)
      .single();

    if (artworkError || !artwork) {
      return NextResponse.json(
        { error: 'Artwork not found' },
        { status: 404 }
      );
    }

    // Determine parody style (random if not specified)
    const style = parodyStyle || Object.keys(PARODY_PROMPTS)[
      Math.floor(Math.random() * Object.keys(PARODY_PROMPTS).length)
    ];

    if (!PARODY_PROMPTS[style]) {
      return NextResponse.json(
        { error: 'Invalid parody style' },
        { status: 400 }
      );
    }

    // Get pet type from conversation state
    const dialogueSession = artwork.dialogue_session_id 
      ? await supabaseAdmin
          .from('dialogue_sessions')
          .select('conversation_state')
          .eq('id', artwork.dialogue_session_id)
          .single()
      : null;

    const petType = dialogueSession?.data?.conversation_state?.petType || 'pet';

    // Build prompt
    const prompt = PARODY_PROMPTS[style].replace('[PET_TYPE]', petType);

    console.log('🎨 Starting Shtuu generation:', {
      artworkId,
      style,
      petType,
      promptPreview: prompt.substring(0, 100) + '...',
    });

    // Update status to processing
    await supabaseAdmin
      .from('artworks')
      .update({
        generation_step: 'generating',
        processing_status: {
          artwork_generation: 'processing',
        },
        parody_style: style,
      })
      .eq('id', artworkId);

    // Start background generation
    generateArtworkInBackground(artworkId, prompt, style, artwork.customer_email);

    return NextResponse.json({
      success: true,
      artworkId,
      parodyStyle: style,
      message: 'Shtuu is creating your artwork! Check back in a minute.',
    });

  } catch (error) {
    console.error('Error in /api/shtuu/generate:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Background generation function
async function generateArtworkInBackground(
  artworkId: string,
  prompt: string,
  style: string,
  customerEmail: string
) {
  try {
    console.log('🎨 Generating artwork:', artworkId);

    // Generate with fal.ai Flux Pro
    const result = await fal.subscribe('fal-ai/flux-pro/v1.1', {
      input: {
        prompt,
        image_size: 'square_hd', // 1024x1024 for good quality
        num_images: 1,
        enable_safety_checker: true,
      },
      logs: true,
      onQueueUpdate: (update: any) => {
        if (update.status === 'IN_PROGRESS') {
          console.log('Generation progress:', update.logs);
        }
      },
    });

    if (result.data && result.data.images && result.data.images[0]) {
      const imageUrl = result.data.images[0].url;

      console.log('✅ Generation complete:', imageUrl);

      // Update artwork with generated image
      await supabaseAdmin!
        .from('artworks')
        .update({
          generation_step: 'completed',
          processing_status: {
            artwork_generation: 'completed',
          },
          generated_images: {
            artwork_preview: imageUrl,
            generation_steps: {
              shtuu_generation: {
                url: imageUrl,
                timestamp: new Date().toISOString(),
                parody_style: style,
              },
            },
          },
        })
        .eq('id', artworkId);

      console.log('✅ Artwork updated in database');

      // TODO: Send email with artwork
      // Will implement in next step

    } else {
      throw new Error('No image generated');
    }

  } catch (error) {
    console.error('❌ Background generation failed:', error);
    
    // Update status to failed
    await supabaseAdmin!
      .from('artworks')
      .update({
        generation_step: 'failed',
        processing_status: {
          artwork_generation: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      })
      .eq('id', artworkId);
  }
}
