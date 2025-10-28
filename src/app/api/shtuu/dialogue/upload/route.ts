import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { UTApi } from 'uploadthing/server';

const utapi = new UTApi();

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const sessionToken = formData.get('sessionToken') as string;
    const email = formData.get('email') as string;

    if (!file || !sessionToken || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get session
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('dialogue_sessions')
      .select('*')
      .eq('session_token', sessionToken)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 404 }
      );
    }

    // Upload file to UploadThing
    const uploadResponse = await utapi.uploadFiles(file);

    if (!uploadResponse.data) {
      throw new Error('Upload failed');
    }

    const imageUrl = uploadResponse.data.url;

    // Create artwork record
    const { data: artwork, error: artworkError } = await supabaseAdmin
      .from('artworks')
      .insert({
        customer_email: email,
        customer_name: email.split('@')[0], // Extract name from email for now
        dialogue_session_id: session.id,
        source_images: {
          pet_photo: imageUrl
        },
        generation_step: 'pending',
        processing_status: {
          artwork_generation: 'pending'
        },
        generation_metadata: {
          source: 'shtuu_dialogue',
          pet_type: session.conversation_state?.petType || 'unknown'
        }
      })
      .select()
      .single();

    if (artworkError) {
      console.error('Error creating artwork:', artworkError);
      return NextResponse.json(
        { error: 'Failed to create artwork record' },
        { status: 500 }
      );
    }

    // Update session with artwork ID
    await supabaseAdmin
      .from('dialogue_sessions')
      .update({
        current_step: 'generating',
        artwork_id: artwork.id,
        last_interaction_at: new Date().toISOString()
      })
      .eq('session_token', sessionToken);

    return NextResponse.json({
      success: true,
      imageUrl,
      artworkId: artwork.id,
      sessionToken
    });

  } catch (error) {
    console.error('Error in dialogue/upload:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
