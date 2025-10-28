'use client';

import { useState } from 'react';
import { UploadButton } from '@/lib/uploadthing';
import Image from 'next/image';

interface ParodyUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const parodyStyles = [
  { id: 'wizard', name: 'Wizard', icon: '🪄', color: 'from-purple-500 to-indigo-600' },
  { id: 'paws', name: 'PAWS', icon: '🦈', color: 'from-blue-500 to-cyan-600' },
  { id: 'popstar', name: 'Popstar', icon: '🎤', color: 'from-red-500 to-pink-600' },
  { id: 'dogfather', name: 'Dogfather', icon: '🎩', color: 'from-amber-600 to-orange-700' },
];

export default function ParodyUploadModal({ isOpen, onClose }: ParodyUploadModalProps) {
  const [step, setStep] = useState<'style' | 'email' | 'upload' | 'generating'>('style');
  const [selectedStyle, setSelectedStyle] = useState<string>('');
  const [email, setEmail] = useState('');
  const [petPhotoUrl, setPetPhotoUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleStyleSelect = (styleId: string) => {
    setSelectedStyle(styleId);
    setStep('email');
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && email.includes('@')) {
      setStep('upload');
    }
  };

  const handleUploadComplete = async (res: any) => {
    if (res && res[0]) {
      setPetPhotoUrl(res[0].url);
      setStep('generating');
      
      // Trigger proof generation
      try {
        setIsSubmitting(true);
        console.log('🚀 Sending proof generation request:', {
          email,
          petPhotoUrl: res[0].url,
          parodyStyle: selectedStyle,
        });

        const response = await fetch('/api/pop5pack/generate-proof', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            petPhotoUrl: res[0].url,
            parodyStyle: selectedStyle,
          }),
        });

        const data = await response.json();
        console.log('📥 Response from API:', { status: response.status, data });

        if (response.ok) {
          // Show success message
          setTimeout(() => {
            onClose();
            // Reset modal state
            setStep('style');
            setSelectedStyle('');
            setEmail('');
            setPetPhotoUrl('');
          }, 2000);
        } else {
          console.error('❌ API returned error:', data);
          alert(`Failed to generate proof: ${data.error || 'Unknown error'}. ${data.details || ''}`);
          setStep('upload'); // Go back to upload step
        }
      } catch (error) {
        console.error('❌ Error generating proof:', error);
        alert('Failed to generate proof. Please try again.');
        setStep('upload'); // Go back to upload step
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const selectedStyleData = parodyStyles.find(s => s.id === selectedStyle);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card-surface rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card-surface border-b border-naples-yellow/20 p-6 flex items-center justify-between rounded-t-3xl">
          <h2 className="font-arvo text-2xl font-bold text-text-primary">
            {step === 'style' && 'Choose Your Free Proof Style'}
            {step === 'email' && 'Enter Your Email'}
            {step === 'upload' && 'Upload Your Pet Photo'}
            {step === 'generating' && 'Creating Your Proof...'}
          </h2>
          <button
            onClick={onClose}
            className="text-text-primary/60 hover:text-text-primary transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Step 1: Style Selection */}
          {step === 'style' && (
            <div className="space-y-6">
              <p className="font-geist text-text-primary/70 text-center mb-8">
                Pick your favorite parody style for your free watermarked proof
              </p>
              <div className="grid grid-cols-2 gap-4">
                {parodyStyles.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => handleStyleSelect(style.id)}
                    className="group relative bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-cyclamen"
                  >
                    <div className={`w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br ${style.color} flex items-center justify-center text-3xl transform group-hover:scale-110 transition-transform duration-300`}>
                      {style.icon}
                    </div>
                    <h3 className="font-arvo text-lg font-bold text-text-primary text-center">
                      {style.name}
                    </h3>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Email Capture */}
          {step === 'email' && selectedStyleData && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className={`w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br ${selectedStyleData.color} flex items-center justify-center text-4xl`}>
                  {selectedStyleData.icon}
                </div>
                <h3 className="font-arvo text-xl font-bold text-text-primary mb-2">
                  {selectedStyleData.name} Style Selected
                </h3>
                <p className="font-geist text-text-primary/70">
                  We'll send your free proof to this email
                </p>
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <label className="block font-geist font-semibold text-text-primary mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 border-naples-yellow/30 focus:border-cyclamen focus:outline-none font-geist"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-atomic-tangerine hover:bg-atomic-tangerine/90 text-white font-fredoka text-lg py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Continue to Upload
                </button>
              </form>

              <button
                onClick={() => setStep('style')}
                className="w-full text-text-primary/60 hover:text-text-primary font-geist text-sm transition-colors"
              >
                ← Change Style
              </button>
            </div>
          )}

          {/* Step 3: Photo Upload */}
          {step === 'upload' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="font-arvo text-xl font-bold text-text-primary mb-2">
                  Upload Your Pet Photo
                </h3>
                <p className="font-geist text-text-primary/70">
                  No cropping or editing needed - we'll handle everything!
                </p>
              </div>

              <div className="border-2 border-dashed border-naples-yellow/50 rounded-2xl p-8 text-center bg-naples-yellow/5">
                <div className="text-6xl mb-4">📸</div>
                <UploadButton
                  endpoint="petPhotoUploader"
                  input={{
                    customerName: 'Pop5Pack User',
                    customerEmail: email,
                    petName: 'Pop5Pack Pet',
                  }}
                  onClientUploadComplete={handleUploadComplete}
                  onUploadError={(error: Error) => {
                    console.error('Upload error:', error);
                    alert('Upload failed. Please try again.');
                  }}
                  appearance={{
                    button: 'bg-cyclamen hover:bg-cyclamen/90 text-white font-fredoka text-lg px-8 py-3 rounded-xl ut-ready:bg-cyclamen ut-uploading:bg-cyclamen/50',
                    allowedContent: 'hidden',
                  }}
                />
                <p className="font-geist text-sm text-text-primary/60 mt-4">
                  Supports JPG, PNG, WebP up to 8MB
                </p>
              </div>

              <button
                onClick={() => setStep('email')}
                className="w-full text-text-primary/60 hover:text-text-primary font-geist text-sm transition-colors"
              >
                ← Back
              </button>
            </div>
          )}

          {/* Step 4: Generating */}
          {step === 'generating' && (
            <div className="text-center py-12">
              <div className="animate-spin w-16 h-16 border-4 border-cyclamen border-t-transparent rounded-full mx-auto mb-6"></div>
              <h3 className="font-arvo text-2xl font-bold text-text-primary mb-3">
                Creating Your Proof...
              </h3>
              <p className="font-geist text-text-primary/70 mb-6">
                This usually takes 2-3 minutes. We'll email you when it's ready!
              </p>
              <div className="bg-naples-yellow/10 rounded-xl p-6 max-w-md mx-auto">
                <p className="font-geist text-sm text-text-primary/80">
                  ✨ Your watermarked proof will be sent to <strong>{email}</strong>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
