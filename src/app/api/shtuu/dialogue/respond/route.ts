import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const { sessionToken, step, response } = await request.json();

    if (!sessionToken || !step || !response) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get current session
    const { data: session, error: fetchError } = await supabaseAdmin
      .from('dialogue_sessions')
      .select('*')
      .eq('session_token', sessionToken)
      .single();

    if (fetchError || !session) {
      return NextResponse.json(
        { error: 'Invalid session token' },
        { status: 404 }
      );
    }

    // Update conversation state with response
    const updatedState = {
      ...session.conversation_state,
      ...response
    };

    // Determine next step based on current step
    let nextStep = 'upload';
    let dialogueMessage = '';
    let dialogueMood: 'idle' | 'happy' | 'thinking' | 'working' = 'idle';
    let actionType: string | undefined;

    if (step === 'welcome' && response.petType) {
      nextStep = 'upload';
      const petType = response.petType === 'dog' ? 'doggies' : 'kitties';
      dialogueMessage = `I love ${petType}! Show me a picture and I will make something for my new friend.`;
      dialogueMood = 'happy';
      actionType = 'upload_image';
    }

    // Update session
    const { error: updateError } = await supabaseAdmin
      .from('dialogue_sessions')
      .update({
        current_step: nextStep,
        conversation_state: updatedState,
        last_interaction_at: new Date().toISOString()
      })
      .eq('session_token', sessionToken);

    if (updateError) {
      console.error('Error updating dialogue session:', updateError);
      return NextResponse.json(
        { error: 'Failed to update session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      sessionToken,
      currentStep: nextStep,
      dialogue: {
        character: 'shtuu',
        message: dialogueMessage,
        mood: dialogueMood,
        action: actionType
      }
    });

  } catch (error) {
    console.error('Error in dialogue/respond:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
