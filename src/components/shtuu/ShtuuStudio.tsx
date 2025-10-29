'use client';

import { useState, useEffect, useCallback } from 'react';
import DialogueBox from './DialogueBox';
import ImageUploadZone from './ImageUploadZone';
import GeneratingAnimation from './GeneratingAnimation';
import ArtworkReveal from './ArtworkReveal';

interface DialogueMessage {
  character: string;
  message: string;
  options?: Array<{
    id: string;
    label: string;
    emoji?: string;
  }>;
  mood?: 'idle' | 'working' | 'happy' | 'thinking';
  action?: string;
}

type DialogueStep = 'welcome' | 'pet_type' | 'upload' | 'generating' | 'reveal' | 'feedback';

interface StudioState {
  sessionToken: string | null;
  currentStep: DialogueStep;
  conversationHistory: DialogueMessage[];
  petType: 'dog' | 'cat' | null;
  artworkId: string | null;
  generatedImageUrl: string | null;
  parodyStyle: string | null;
  isLoading: boolean;
}

export default function ShtuuStudio() {
  const [state, setState] = useState<StudioState>({
    sessionToken: null,
    currentStep: 'welcome',
    conversationHistory: [],
    petType: null,
    artworkId: null,
    generatedImageUrl: null,
    parodyStyle: null,
    isLoading: false
  });

  // Initialize dialogue session
  useEffect(() => {
    startDialogueSession();
  }, []);

  // (moved) listener defined after handleOptionSelect

  const startDialogueSession = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch('/api/shtuu/dialogue/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: null, 
          source: 'landing_page' 
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.dialogue) {
        setState(prev => ({
          ...prev,
          sessionToken: data.sessionToken,
          currentStep: data.currentStep,
          conversationHistory: [data.dialogue],
          isLoading: false
        }));
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Failed to start dialogue:', error);
      // Set fallback state so page still renders
      setState(prev => ({
        ...prev,
        sessionToken: null,
        conversationHistory: [{
          character: 'shtuu',
          message: "Hi! I'm Shtuu, and I love making art of pets. Do you have a pet?",
          options: [
            { id: 'dog', label: 'Dog', emoji: '🐕' },
            { id: 'cat', label: 'Cat', emoji: '🐈' }
          ],
          mood: 'idle' as const
        }],
        isLoading: false
      }));
    }
  };

  const handleOptionSelect = useCallback(async (optionId: string) => {
    if (!state.sessionToken) return;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await fetch('/api/shtuu/dialogue/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionToken: state.sessionToken,
          step: state.currentStep,
          response: { petType: optionId }
        })
      });

      const data = await response.json();

      if (data.success) {
        setState(prev => ({
          ...prev,
          currentStep: data.currentStep,
          petType: optionId as 'dog' | 'cat',
          conversationHistory: [...prev.conversationHistory, data.dialogue],
          isLoading: false
        }));
      }
    } catch (error) {
      console.error('Failed to send response:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.sessionToken, state.currentStep]);

  // Listen for hero overlay button selections (after handleOptionSelect is defined)
  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<{ id: string }>;
      if (custom.detail?.id) {
        handleOptionSelect(custom.detail.id);
      }
    };
    window.addEventListener('shtuu:selectOption', handler as EventListener);
    return () => window.removeEventListener('shtuu:selectOption', handler as EventListener);
  }, [handleOptionSelect]);

  const currentDialogue = state.conversationHistory[state.conversationHistory.length - 1];

  return (
    <div className="py-12 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Dialogue area */}
        <div className="flex flex-col gap-6">

          {/* Image upload component */}
          {state.currentStep === 'upload' && state.sessionToken && (
            <ImageUploadZone
              sessionToken={state.sessionToken}
              onUploadComplete={async (imageUrl, artworkId) => {
                setState(prev => ({
                  ...prev,
                  artworkId,
                  currentStep: 'generating',
                  conversationHistory: [...prev.conversationHistory, {
                    character: 'shtuu',
                    message: 'So cute! I have a great idea for something…',
                    mood: 'working'
                  }]
                }));

                // Trigger generation
                try {
                  await fetch('/api/shtuu/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ artworkId })
                  });
                } catch (error) {
                  console.error('Generation trigger error:', error);
                }
              }}
              onError={(error) => {
                console.error('Upload error:', error);
                alert(error);
              }}
            />
          )}
          
          {/* Generating with polling */}
          {state.currentStep === 'generating' && state.artworkId && (
            <GeneratingAnimation
              artworkId={state.artworkId}
              onComplete={(imageUrl, parodyStyle) => {
                setState(prev => ({
                  ...prev,
                  currentStep: 'reveal',
                  generatedImageUrl: imageUrl,
                  parodyStyle,
                  conversationHistory: [...prev.conversationHistory, {
                    character: 'shtuu',
                    message: 'I made this for you! Do you like it?',
                    mood: 'happy'
                  }]
                }));
              }}
              onError={(error) => {
                console.error('Generation error:', error);
                alert(error);
              }}
            />
          )}

          {/* Options are rendered on the hero overlay */}

            {/* Artwork reveal */}
            {state.currentStep === 'reveal' && state.generatedImageUrl && (
              <ArtworkReveal
                imageUrl={state.generatedImageUrl}
                parodyStyle={state.parodyStyle || 'unknown'}
                onDownload={() => {
                  window.open(state.generatedImageUrl!, '_blank');
                }}
              />
            )}
        </div>
      </div>
    </div>
  );
}
