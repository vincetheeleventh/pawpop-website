import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const { userId, source } = await request.json();

    // Generate unique session token
    const sessionToken = `sess_${nanoid(24)}`;

    // Create dialogue session
    const { data: session, error } = await supabaseAdmin
      .from('dialogue_sessions')
      .insert({
        user_id: userId || null,
        session_token: sessionToken,
        current_step: 'welcome',
        conversation_state: {},
        session_metadata: {
          source: source || 'landing_page',
          user_agent: request.headers.get('user-agent'),
          started_at: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating dialogue session:', error);
      return NextResponse.json(
        { error: 'Failed to start dialogue session' },
        { status: 500 }
      );
    }

    // Return welcome dialogue
    return NextResponse.json({
      success: true,
      sessionToken: session.session_token,
      currentStep: 'welcome',
      dialogue: {
        character: 'shtuu',
        message: "Hi! I'm Shtuu, and I love making art of pets. Do you have a pet?",
        options: [
          { id: 'dog', label: 'Dog', emoji: '🐕' },
          { id: 'cat', label: 'Cat', emoji: '🐈' }
        ],
        mood: 'idle'
      }
    });

  } catch (error) {
    console.error('Error in dialogue/start:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
