'use client';

import Image from 'next/image';

interface ShtuuCharacterProps {
  mood?: 'idle' | 'working' | 'happy' | 'thinking';
  size?: 'sm' | 'md' | 'lg';
  showPixel?: boolean;
}

const getSizePixels = (size: 'sm' | 'md' | 'lg'): number => {
  switch (size) {
    case 'sm': return 200;
    case 'md': return 300;
    case 'lg': return 400;
    default: return 300;
  }
};

export default function ShtuuCharacter({ 
  mood = 'idle', 
  size = 'md',
  showPixel = false 
}: ShtuuCharacterProps) {
  const sizeInPixels = getSizePixels(size);

  return (
    <div className="relative flex items-center justify-center">
      {/* Placeholder for Shtuu character - will be replaced with actual image */}
      <div 
        className="relative bg-gradient-to-br from-purple-200 to-pink-200 rounded-full flex items-center justify-center transition-opacity duration-300 shadow-lg"
        style={{ width: sizeInPixels, height: sizeInPixels }}
      >
        {/* Placeholder character emoji - replace with actual Shtuu image */}
        <div className="text-8xl">
          {mood === 'happy' && '😊'}
          {mood === 'working' && '🎨'}
          {mood === 'thinking' && '🤔'}
          {mood === 'idle' && '😌'}
        </div>
        
        {/* Label for development */}
        <div className="absolute bottom-2 left-0 right-0 text-center">
          <span className="text-xs bg-white/80 px-2 py-1 rounded-full">
            Shtuu ({mood})
          </span>
        </div>
      </div>
      
      {/* Pixel (cat companion) - optional */}
      {showPixel && (
        <div 
          className="absolute bottom-0 right-0 bg-gradient-to-br from-orange-200 to-yellow-200 rounded-full flex items-center justify-center shadow-md"
          style={{ width: sizeInPixels * 0.4, height: sizeInPixels * 0.4 }}
        >
          <span className="text-3xl">🐱</span>
        </div>
      )}
    </div>
  );
}
