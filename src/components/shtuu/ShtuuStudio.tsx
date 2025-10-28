'use client';

import { useState, useEffect } from 'react';
import ShtuuCharacter from './ShtuuCharacter';
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

  const handleOptionSelect = async (optionId: string) => {
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
  };

  const currentDialogue = state.conversationHistory[state.conversationHistory.length - 1];
  const currentMood = currentDialogue?.mood || 'idle';

  return (
    <div className="min-h-screen bg-site-bg py-12 px-4">
      {/* Placeholder background - will be replaced with actual studio background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 opacity-50" />
      
      <div className="max-w-4xl mx-auto">
        {/* Studio header */}
        <div className="flex items-center justify-center mb-8">
          <h1 className="font-arvo text-3xl md:text-4xl font-bold text-text-primary">
            Shtuu's Studio
          </h1>
        </div>

        {/* Main dialogue area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left: Shtuu Character */}
          <div className="flex flex-col items-center justify-center order-2 lg:order-1">
            <ShtuuCharacter 
              mood={currentMood}
              size="lg"
              showPixel={state.currentStep !== 'welcome'}
            />
            <p className="font-geist text-sm text-text-primary/60 mt-4 text-center italic">
              {state.isLoading && 'Thinking...'}
              {!state.isLoading && state.currentStep === 'welcome' && 'Ready to create!'}
              {!state.isLoading && state.currentStep === 'upload' && 'Excited to see your pet!'}
            </p>
          </div>

          {/* Right: Dialogue box */}
          <div className="flex flex-col gap-6 order-1 lg:order-2">
            {currentDialogue && (
              <DialogueBox
                message={currentDialogue.message}
                options={currentDialogue.options}
                onSelectOption={handleOptionSelect}
                isTyping={state.isLoading}
              />
            )}

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
    </div>
  );
}
