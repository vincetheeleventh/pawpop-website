import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fal } from '@fal-ai/client';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Configure fal.ai
fal.config({
  credentials: process.env.FAL_KEY || process.env.HF_TOKEN,
});

// Parody style prompts
const PARODY_PROMPTS: Record<string, string> = {
  wizard: 'A magical wizard portrait in the style of a prestigious wizarding school, featuring a [PET_TYPE] wearing wizard robes and a pointed hat, set in an ornate golden frame with magical elements, dramatic lighting, oil painting style, highly detailed',
  paws: 'Movie poster in the iconic Jaws style, featuring a [PET_TYPE] emerging from water with dramatic lighting, bold typography "PAWS" at the top, vintage 1970s movie poster aesthetic, high contrast, cinematic',
  popstar: 'Album cover in the iconic Michael Jackson Thriller style, featuring a [PET_TYPE] in a red leather jacket with dramatic pose, 1980s aesthetic, bold colors, high contrast, professional photography style',
  dogfather: 'A dramatic mafia boss portrait featuring a [PET_TYPE] in a dark suit with dramatic side lighting, inspired by The Godfather movie poster, oil painting style, dark moody atmosphere, highly detailed, cinematic',
};

export async function POST(request: NextRequest) {
  try {
    // Validate environment variables
    if (!process.env.FAL_KEY && !process.env.HF_TOKEN) {
      console.error('❌ FAL_KEY or HF_TOKEN not configured');
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 500 }
      );
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ Supabase credentials not configured');
      return NextResponse.json(
        { error: 'Database service not configured' },
        { status: 500 }
      );
    }

    const { email, petPhotoUrl, parodyStyle } = await request.json();

    // Validation
    if (!email || !petPhotoUrl || !parodyStyle) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!PARODY_PROMPTS[parodyStyle]) {
      return NextResponse.json(
        { error: 'Invalid parody style' },
        { status: 400 }
      );
    }

    // Create artwork record in database (for 5pack)
    const { data: artwork, error: artworkError } = await supabase
      .from('artworks')
      .insert({
        customer_email: email,
        source_images: {
          pet_photo: petPhotoUrl,
        },
        generation_step: 'pending',
        processing_status: {
          artwork_generation: 'pending',
        },
        generation_metadata: {
          product_type: 'pop5pack',
          parody_style: parodyStyle,
          is_proof: true, // Mark as proof generation
        },
      })
      .select()
      .single();

    if (artworkError) {
      console.error('Error creating artwork record:', artworkError);
      return NextResponse.json(
        { error: 'Failed to create artwork record' },
        { status: 500 }
      );
    }

    // Generate proof using fal.ai (low-res, will add watermark later)
    const prompt = PARODY_PROMPTS[parodyStyle].replace('[PET_TYPE]', 'pet');
    
    console.log('Generating proof with fal.ai:', {
      artworkId: artwork.id,
      parodyStyle,
      prompt: prompt.substring(0, 100) + '...',
    });

    // Start background generation (non-blocking)
    generateProofInBackground(artwork.id, petPhotoUrl, prompt, email, parodyStyle);

    return NextResponse.json({
      success: true,
      artworkId: artwork.id,
      message: 'Proof generation started. Check your email in 2-3 minutes!',
    });

  } catch (error) {
    console.error('Error in generate-proof:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error,
    });
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Background generation function
async function generateProofInBackground(
  artworkId: string,
  petPhotoUrl: string,
  prompt: string,
  email: string,
  parodyStyle: string
) {
  try {
    // Update status to processing
    await supabase
      .from('artworks')
      .update({
        generation_step: 'monalisa_generation', // Reusing existing step
        processing_status: {
          artwork_generation: 'processing',
        },
      })
      .eq('id', artworkId);

    // Generate with fal.ai Flux Pro
    const result = await fal.subscribe('fal-ai/flux-pro/v1.1', {
      input: {
        prompt,
        image_size: 'square', // Low-res for proof
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

      // Update artwork with generated image
      await supabase
        .from('artworks')
        .update({
          generation_step: 'completed',
          processing_status: {
            artwork_generation: 'completed',
          },
          generated_images: {
            artwork_preview: imageUrl, // Low-res proof
            generation_steps: {
              proof_generation: {
                url: imageUrl,
                timestamp: new Date().toISOString(),
                parody_style: parodyStyle,
              },
            },
          },
        })
        .eq('id', artworkId);

      // Send email with proof (will implement email function next)
      await sendProofEmail(email, imageUrl, parodyStyle, artworkId);

      console.log('Proof generation completed:', artworkId);
    } else {
      throw new Error('No image generated');
    }

  } catch (error) {
    console.error('Error in background generation:', error);
    
    // Update status to failed
    await supabase
      .from('artworks')
      .update({
        generation_step: 'failed',
        processing_status: {
          artwork_generation: 'failed',
        },
      })
      .eq('id', artworkId);
  }
}

// Email function - send proof with watermarked preview
async function sendProofEmail(
  email: string,
  imageUrl: string,
  parodyStyle: string,
  artworkId: string
) {
  try {
    const { sendPop5PackProofEmail } = await import('@/lib/email');
    
    const result = await sendPop5PackProofEmail({
      customerEmail: email,
      proofImageUrl: imageUrl,
      parodyStyle,
      artworkId,
    });

    if (result.success) {
      console.log('✅ Proof email sent successfully:', result.messageId);
      return true;
    } else {
      console.error('❌ Failed to send proof email:', result.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Error sending proof email:', error);
    return false;
  }
}
