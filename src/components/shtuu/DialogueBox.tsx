'use client';

import { useState, useEffect } from 'react';

interface DialogueOption {
  id: string;
  label: string;
  emoji?: string;
  disabled?: boolean;
}

interface DialogueBoxProps {
  message: string;
  options?: DialogueOption[];
  onSelectOption?: (optionId: string) => void;
  isTyping?: boolean;
}

export default function DialogueBox({
  message,
  options = [],
  onSelectOption,
  isTyping = false
}: DialogueBoxProps) {
  const [displayedText, setDisplayedText] = useState('');
  
  // Typewriter effect
  useEffect(() => {
    if (isTyping) {
      let index = 0;
      setDisplayedText('');
      const interval = setInterval(() => {
        setDisplayedText(message.slice(0, index));
        index++;
        if (index > message.length) {
          clearInterval(interval);
        }
      }, 30);
      return () => clearInterval(interval);
    } else {
      setDisplayedText(message);
    }
  }, [message, isTyping]);

  return (
    <div className="bg-card-surface border-2 border-naples-yellow rounded-2xl p-6 shadow-lg relative">
      {/* Speech bubble tail */}
      <div className="absolute -left-3 top-8 w-6 h-6 bg-card-surface border-l-2 border-b-2 border-naples-yellow transform rotate-45" />
      
      {/* Message text */}
      <p className="font-geist text-lg text-text-primary mb-4 min-h-[60px]">
        {displayedText}
        {isTyping && <span className="animate-pulse">|</span>}
      </p>
      
      {/* Options */}
      {options.length > 0 && !isTyping && (
        <div className="flex flex-col gap-3">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => onSelectOption?.(option.id)}
              disabled={option.disabled}
              className="bg-atomic-tangerine hover:bg-atomic-tangerine/90 text-white font-fredoka text-lg px-6 py-3 rounded-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {option.emoji && <span className="mr-2">{option.emoji}</span>}
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
