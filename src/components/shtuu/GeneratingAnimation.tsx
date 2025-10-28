'use client';

import { useState, useEffect } from 'react';

interface GeneratingAnimationProps {
  artworkId: string;
  onComplete: (imageUrl: string, parodyStyle: string) => void;
  onError: (error: string) => void;
}

export default function GeneratingAnimation({
  artworkId,
  onComplete,
  onError
}: GeneratingAnimationProps) {
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("Shtuu is getting started...");

  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    let progressInterval: NodeJS.Timeout;
    let attempts = 0;
    const maxAttempts = 60; // 60 attempts = 2 minutes max

    // Simulate progress animation
    progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev; // Stop at 90% until actually complete
        return prev + Math.random() * 10;
      });
    }, 1000);

    // Update status messages
    const messages = [
      "Shtuu is getting started...",
      "Choosing the perfect style...",
      "Adding artistic touches...",
      "Almost there...",
    ];

    let messageIndex = 0;
    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % messages.length;
      setStatusMessage(messages[messageIndex]);
    }, 5000);

    // Poll for completion
    pollInterval = setInterval(async () => {
      attempts++;

      if (attempts > maxAttempts) {
        clearInterval(pollInterval);
        clearInterval(progressInterval);
        clearInterval(messageInterval);
        onError('Generation took too long. Please try again.');
        return;
      }

      try {
        const response = await fetch(`/api/shtuu/status?artworkId=${artworkId}`);
        const data = await response.json();

        if (data.isComplete && data.imageUrl) {
          clearInterval(pollInterval);
          clearInterval(progressInterval);
          clearInterval(messageInterval);
          setProgress(100);
          setStatusMessage("All done!");
          
          // Small delay for animation
          setTimeout(() => {
            onComplete(data.imageUrl, data.parodyStyle || 'unknown');
          }, 500);
        } else if (data.isFailed) {
          clearInterval(pollInterval);
          clearInterval(progressInterval);
          clearInterval(messageInterval);
          onError('Something went wrong. Please try again.');
        }
      } catch (error) {
        console.error('Polling error:', error);
        // Continue polling on network errors
      }
    }, 2000); // Poll every 2 seconds

    return () => {
      clearInterval(pollInterval);
      clearInterval(progressInterval);
      clearInterval(messageInterval);
    };
  }, [artworkId, onComplete, onError]);

  return (
    <div className="bg-card-surface border-2 border-cyclamen rounded-2xl p-8 text-center">
      <div className="space-y-6">
        {/* Animated Shtuu working */}
        <div className="flex justify-center">
          <div className="text-8xl animate-bounce">
            🎨
          </div>
        </div>

        {/* Status message */}
        <p className="font-geist text-xl text-text-primary animate-pulse">
          {statusMessage}
        </p>

        {/* Progress bar */}
        <div className="w-full bg-site-bg rounded-full h-3 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-cyclamen via-atomic-tangerine to-naples-yellow h-full transition-all duration-500 ease-out"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>

        {/* Percentage */}
        <p className="font-fredoka text-sm text-text-primary/60">
          {Math.round(progress)}% complete
        </p>

        {/* Tip */}
        <div className="bg-pale-azure/10 border border-pale-azure/30 rounded-lg p-3 mt-6">
          <p className="text-sm text-text-primary/70 font-geist">
            💡 <strong>Tip:</strong> Shtuu is carefully crafting your artwork. This usually takes 30-90 seconds!
          </p>
        </div>
      </div>
    </div>
  );
}
