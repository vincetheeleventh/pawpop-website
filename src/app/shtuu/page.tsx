"use client";

import ShtuuStudio from '@/components/shtuu/ShtuuStudio';
import Image from 'next/image';
import DialogueBox from '@/components/shtuu/DialogueBox';
import ImageUploadZone from '@/components/shtuu/ImageUploadZone';
import { useCallback, useEffect, useMemo, useState } from 'react';

export default function ShtuuPage() {
  const [aspect, setAspect] = useState<number | null>(null);
  const [frame, setFrame] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  
  // Sequential animation states
  const [showBubble1, setShowBubble1] = useState(false);
  const [showText1, setShowText1] = useState(false);
  const [isTyping1, setIsTyping1] = useState(false);
  const [showBubble2, setShowBubble2] = useState(false);
  const [showText2, setShowText2] = useState(false);
  const [isTyping2, setIsTyping2] = useState(false);
  const [showBubble3, setShowBubble3] = useState(false);
  
  // Conversation flow states
  const [petType, setPetType] = useState<'dog' | 'cat' | null>(null);
  const [showUploadDialogue, setShowUploadDialogue] = useState(false);
  const [sessionToken] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  // Sequential animation flow
  useEffect(() => {
    // Step 1: Show first bubble (top-left "Hi my name is Shtuu")
    const timer1 = setTimeout(() => {
      setShowBubble1(true);
    }, 300);

    // Step 1a: Show text after box animation completes (300ms)
    const timer1a = setTimeout(() => {
      setShowText1(true);
    }, 300 + 300); // Show bubble + wait for pop animation

    // Step 1b: Start typing after text appears
    const timer1b = setTimeout(() => {
      setIsTyping1(true);
    }, 300 + 300); // Show bubble + wait for pop animation

    // Step 2: First bubble finishes typing, show second bubble
    const timer2 = setTimeout(() => {
      setIsTyping1(false);
      setShowBubble2(true);
    }, 300 + 300 + 800); // Previous + typing time

    // Step 2a: Show text after box animation completes
    const timer2a = setTimeout(() => {
      setShowText2(true);
    }, 300 + 300 + 800 + 300); // Previous + wait for pop animation

    // Step 2b: Start typing in second bubble after its animation
    const timer2b = setTimeout(() => {
      setIsTyping2(true);
    }, 300 + 300 + 800 + 300); // Previous + wait for pop animation

    // Step 3: Second bubble finishes typing, show third bubble (buttons)
    const timer3 = setTimeout(() => {
      setIsTyping2(false);
      setShowBubble3(true);
    }, 300 + 300 + 800 + 300 + 2000); // Previous + typing time

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer1a);
      clearTimeout(timer1b);
      clearTimeout(timer2);
      clearTimeout(timer2a);
      clearTimeout(timer2b);
      clearTimeout(timer3);
    };
  }, []);

  // Handle pet type selection
  const handlePetSelection = useCallback((type: 'dog' | 'cat') => {
    setPetType(type);
    setShowUploadDialogue(true);
  }, []);

  // Handle upload completion
  const handleUploadComplete = useCallback((imageUrl: string, artworkId: string) => {
    console.log('Upload complete:', { imageUrl, artworkId });
    // TODO: Navigate to generation/loading step
  }, []);

  // Handle upload error
  const handleUploadError = useCallback((error: string) => {
    console.error('Upload error:', error);
    alert(error); // TODO: Show error in dialogue box
  }, []);

  const computeFrame = useCallback((a: number) => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // Fit inside viewport without cropping based on aspect
    const fitWidth = Math.min(vw, vh * a);
    const fitHeight = Math.min(vh, vw / a);
    setFrame({ width: fitWidth, height: fitHeight });
  }, []);

  useEffect(() => {
    if (aspect) {
      computeFrame(aspect);
      const onResize = () => computeFrame(aspect);
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    }
  }, [aspect, computeFrame]);
  return (
    <main className="min-h-screen bg-site-bg">
      {/* Hero Section */}
      <section className="w-full overflow-hidden">
        {/* Mobile: object-cover (sides crop), tall viewport usage */}
        <div className="relative block md:hidden h-[80vh]">
          <Image
            src="/images/shtuu/shtuu_hero.png"
            alt="Shtuu's Studio - AI Art for Your Pet"
            fill
            className="object-cover object-center"
            priority
          />
          {/* Mobile intro bubble overlay at top-left with tail pointing bottom-right */}
          {showBubble1 && (
            <div className="absolute top-[10%] left-[6%] z-10 animate-dialogue-pop origin-center max-w-[70%]">
              <DialogueBox message="Hi, my name is Shtuu." isTyping={isTyping1} showText={showText1} compact />
            </div>
          )}
        </div>
        {/* Mobile dialogue boxes BELOW the image */}
        <div className="block md:hidden px-4 mt-4 space-y-3">
          {/* Prompt box */}
          {showBubble2 && (
            <div className="relative -mt-16 z-20 animate-dialogue-pop origin-center">
              <DialogueBox message="I will draw your pet. Do you have a dog or a cat?" isTyping={isTyping2} showText={showText2} compact />
            </div>
          )}
          {/* Buttons box */}
          {showBubble3 && !showUploadDialogue && (
            <div className="relative animate-dialogue-pop origin-center">
              <div className="relative bg-card-surface border-2 border-naples-yellow rounded-2xl p-3 shadow-lg w-full">
                <div className="flex flex-col gap-2 items-stretch">
                  <button onClick={() => handlePetSelection('dog')} className="bg-atomic-tangerine hover:bg-atomic-tangerine/90 text-white font-fredoka text-base px-5 py-3 rounded-xl transition-all duration-200">
                    <span className="mr-2">🐕</span>Dog
                  </button>
                  <button onClick={() => handlePetSelection('cat')} className="bg-atomic-tangerine hover:bg-atomic-tangerine/90 text-white font-fredoka text-base px-5 py-3 rounded-xl transition-all duration-200">
                    <span className="mr-2">🐈</span>Cat
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Upload dialogue (Step 3 in PRD) */}
          {showUploadDialogue && (
            <div className="relative animate-dialogue-pop origin-center mt-4">
              <div className="relative bg-card-surface border-2 border-naples-yellow rounded-2xl p-4 shadow-lg w-full">
                <p className="font-geist text-sm text-text-primary mb-3">
                  I love {petType === 'dog' ? 'doggies' : 'kitties'}! Show me a picture and I will make something for my new friend
                </p>
                <ImageUploadZone
                  sessionToken={sessionToken}
                  onUploadComplete={handleUploadComplete}
                  onError={handleUploadError}
                />
              </div>
            </div>
          )}
        </div>

        {/* Desktop: object-contain, exact image frame */}
        <div className="relative hidden md:flex h-screen items-center justify-center">
          <div className="relative" style={{ width: frame.width || '100%', height: frame.height || '100%' }}>
            <Image
              src="/images/shtuu/shtuu_hero.png"
              alt="Shtuu's Studio - AI Art for Your Pet"
              fill
              className="object-contain object-center"
              priority
              onLoadingComplete={(img) => {
                const a = img.naturalWidth / img.naturalHeight;
                setAspect(a);
              }}
            />
            {/* Top-left bubble */}
            {showBubble1 && (
              <div className="absolute top-[8%] left-[6%] z-10 animate-dialogue-pop origin-center max-w-xs">
                <DialogueBox message="Hi my name is Shtuu" isTyping={isTyping1} showText={showText1} />
              </div>
            )}
            {/* Middle-right */}
            {showBubble2 && (
              <div className="absolute top-[50%] right-[6%] -translate-y-1/2 z-10 animate-dialogue-pop origin-center">
                <DialogueBox message="I will draw your pet. Do you have a dog or a cat?" isTyping={isTyping2} showText={showText2} compact />
              </div>
            )}
            {/* Bottom-center buttons */}
            {showBubble3 && !showUploadDialogue && (
              <div className="absolute bottom-[6%] left-1/2 -translate-x-1/2 z-10 animate-dialogue-pop origin-center">
                <div className="relative bg-card-surface border-2 border-naples-yellow rounded-2xl p-4 shadow-lg max-w-md w-full">
                  <div className="flex flex-col gap-3 items-stretch">
                    <button onClick={() => handlePetSelection('dog')} className="bg-atomic-tangerine hover:bg-atomic-tangerine/90 text-white font-fredoka text-lg px-6 py-3 rounded-xl transition-all duration-200 hover:scale-105">
                      <span className="mr-2">🐕</span>Dog
                    </button>
                    <button onClick={() => handlePetSelection('cat')} className="bg-atomic-tangerine hover:bg-atomic-tangerine/90 text-white font-fredoka text-lg px-6 py-3 rounded-xl transition-all duration-200 hover:scale-105">
                      <span className="mr-2">🐈</span>Cat
                    </button>
                  </div>
                </div>
              </div>
            )}
            {/* Upload dialogue (Step 3 in PRD) - Desktop */}
            {showUploadDialogue && (
              <div className="absolute bottom-[6%] left-1/2 -translate-x-1/2 z-10 animate-dialogue-pop origin-center">
                <div className="relative bg-card-surface border-2 border-naples-yellow rounded-2xl p-6 shadow-lg max-w-lg w-full">
                  <p className="font-geist text-base text-text-primary mb-4">
                    I love {petType === 'dog' ? 'doggies' : 'kitties'}! Show me a picture and I will make something for my new friend
                  </p>
                  <ImageUploadZone
                    sessionToken={sessionToken}
                    onUploadComplete={handleUploadComplete}
                    onError={handleUploadError}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Studio Section */}
      <ShtuuStudio />
    </main>
  );
}
