'use client';

import React, { useState, useRef } from 'react';
import { X, Upload, ArrowRight, ArrowLeft, Check, Camera, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  petMomPhoto: File | null;
  petPhoto: File | null;
  name: string;
  email: string;
}

interface ProcessingState {
  step: 'uploading' | 'generating' | 'saving' | 'complete' | 'error';
  message: string;
  progress: number;
}

export const UploadModal = ({ isOpen, onClose }: UploadModalProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    petMomPhoto: null,
    petPhoto: null,
    name: '',
    email: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processing, setProcessing] = useState<ProcessingState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState<{ petMom: boolean; pet: boolean }>({ petMom: false, pet: false });
  const router = useRouter();

  const petMomInputRef = useRef<HTMLInputElement>(null);
  const petInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (file: File, type: 'petMom' | 'pet') => {
    if (type === 'petMom') {
      setFormData(prev => ({ ...prev, petMomPhoto: file }));
    } else {
      setFormData(prev => ({ ...prev, petPhoto: file }));
    }
  };

  const handleDragOver = (e: React.DragEvent, type: 'petMom' | 'pet') => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent, type: 'petMom' | 'pet') => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(prev => ({ ...prev, [type]: true }));
  };

  const handleDragLeave = (e: React.DragEvent, type: 'petMom' | 'pet') => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(prev => ({ ...prev, [type]: false }));
  };

  const handleDrop = (e: React.DragEvent, type: 'petMom' | 'pet') => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(prev => ({ ...prev, [type]: false }));
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      // Validate file type
      if (file.type.startsWith('image/')) {
        handleFileUpload(file, type);
      }
    }
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!formData.petMomPhoto || !formData.petPhoto) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Create artwork record and send confirmation email immediately
      const createResponse = await fetch('/api/artwork/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_name: formData.name,
          customer_email: formData.email,
        }),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData.error || 'Failed to create artwork record');
      }

      const { artwork, access_token } = await createResponse.json();

      // Send confirmation email immediately
      try {
        await fetch('/api/upload/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer_name: formData.name,
            customer_email: formData.email,
            uploaded_file_url: 'pending'
          })
        });
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
        // Don't fail the process if email fails
      }
      
      // Track photo upload conversion
      if (typeof window !== 'undefined') {
        const { trackPhotoUpload } = await import('@/lib/google-ads');
        trackPhotoUpload(5); // $5 CAD lead value
      }
      
      // Show immediate confirmation
      setProcessing({ step: 'complete', message: 'Thank you! We\'ve received your photos and started creating your masterpiece. Check your email for confirmation!', progress: 100 });
      
      // Store artwork info for order page
      localStorage.setItem('pawpop-artwork-data', JSON.stringify({
        artworkId: artwork.id,
        accessToken: access_token,
        customerName: formData.name,
        customerEmail: formData.email,
        timestamp: Date.now()
      }));
      
      // Start background generation (don't wait for it)
      const formDataToSend = new FormData();
      formDataToSend.append('userImage', formData.petMomPhoto);
      formDataToSend.append('petImage', formData.petPhoto);
      
      fetch('/api/monalisa-complete', {
        method: 'POST',
        body: formDataToSend,
      }).then(async (response) => {
        if (response.ok) {
          const responseData = await response.json();
          const generatedImageUrl = responseData.generatedImageUrl;
          if (generatedImageUrl) {
            // Update artwork with generated image in background
            await fetch('/api/artwork/update', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                artwork_id: artwork.id,
                generated_image_url: generatedImageUrl,
                generation_step: 'completed'
              })
            });

            // Track artwork generation completion conversion
            if (typeof window !== 'undefined') {
              const { trackArtworkGeneration } = await import('@/lib/google-ads');
              trackArtworkGeneration(artwork.id, 15); // $15 CAD qualified lead value
            }

            // Send completion email with the generated image
            try {
              await fetch('/api/email/masterpiece-ready', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  customerName: formData.name,
                  customerEmail: formData.email,
                  artworkUrl: `${window.location.origin}/artwork/${access_token}`,
                  generatedImageUrl: generatedImageUrl
                })
              });
              console.log('Completion email sent successfully');
            } catch (emailError) {
              console.error('Failed to send completion email:', emailError);
              // Don't fail the process if email fails
            }
          }
        }
      }).catch((error) => {
        console.error('Background generation failed:', error);
      });
      
      // Redirect immediately after showing confirmation
      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
        router.push(`/artwork/${access_token}`);
      }, 1500);
      
    } catch (error) {
      console.error('Artwork submission failed:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error: error
      });
      setError(error instanceof Error ? error.message : 'Something went wrong');
      setProcessing({ step: 'error', message: 'Submission failed', progress: 0 });
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return formData.petMomPhoto !== null;
      case 2: return formData.petPhoto !== null;
      case 3: return formData.name.trim() !== '' && formData.email.trim() !== '';
      default: return false;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl" data-testid="upload-modal">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Progress Bar */}
        <div className="px-6 pt-6">
          <div className="flex items-center justify-between mb-6">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${currentStep >= step 
                    ? 'bg-mona-gold text-charcoal-frame' 
                    : 'bg-gray-200 text-gray-400'
                  }
                `}>
                  {currentStep > step ? <Check size={16} /> : step}
                </div>
                {step < 3 && (
                  <div className={`
                    w-16 h-1 mx-2
                    ${currentStep > step ? 'bg-mona-gold' : 'bg-gray-200'}
                  `} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="px-6 pb-6">
          {/* Step 1: Pet Mom Photo */}
          {currentStep === 1 && (
            <div className="text-center">
              <div className="mb-4">
                <Camera className="w-12 h-12 text-mona-gold mx-auto mb-3" />
                <h2 className="text-xl font-playfair font-bold text-charcoal-frame mb-2">
                  Upload Your Photo
                </h2>
                <p className="text-gray-600 text-sm">
                  Upload a clear photo of yourself (the pet mom) for the Mona Lisa transformation
                </p>
              </div>

              <div 
                onClick={() => petMomInputRef.current?.click()}
                onDragOver={(e) => handleDragOver(e, 'petMom')}
                onDragEnter={(e) => handleDragEnter(e, 'petMom')}
                onDragLeave={(e) => handleDragLeave(e, 'petMom')}
                onDrop={(e) => handleDrop(e, 'petMom')}
                className={`
                  border-2 border-dashed rounded-lg p-8 cursor-pointer transition-colors
                  ${formData.petMomPhoto 
                    ? 'border-mona-gold bg-mona-gold/10' 
                    : dragActive.petMom 
                      ? 'border-mona-gold bg-mona-gold/20 border-solid'
                      : 'border-gray-300 hover:border-mona-gold hover:bg-mona-gold/5'
                  }
                `}
              >
                {formData.petMomPhoto ? (
                  <div>
                    <Check className="w-8 h-8 text-mona-gold mx-auto mb-2" />
                    <p className="text-sm font-medium text-charcoal-frame">
                      {formData.petMomPhoto.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Click to change photo
                    </p>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      JPG, PNG up to 10MB
                    </p>
                  </div>
                )}
              </div>

              <input
                ref={petMomInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, 'petMom');
                }}
              />
            </div>
          )}

          {/* Step 2: Pet Photo */}
          {currentStep === 2 && (
            <div className="text-center">
              <div className="mb-4">
                <div className="w-12 h-12 bg-warm-peach/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🐕</span>
                </div>
                <h2 className="text-xl font-playfair font-bold text-charcoal-frame mb-2">
                  Upload Your Pet's Photo
                </h2>
                <p className="text-gray-600 text-sm">
                  Upload a clear photo of your beloved pet to include in the masterpiece
                </p>
              </div>

              <div 
                onClick={() => petInputRef.current?.click()}
                onDragOver={(e) => handleDragOver(e, 'pet')}
                onDragEnter={(e) => handleDragEnter(e, 'pet')}
                onDragLeave={(e) => handleDragLeave(e, 'pet')}
                onDrop={(e) => handleDrop(e, 'pet')}
                className={`
                  border-2 border-dashed rounded-lg p-8 cursor-pointer transition-colors
                  ${formData.petPhoto 
                    ? 'border-warm-peach bg-warm-peach/10' 
                    : dragActive.pet 
                      ? 'border-warm-peach bg-warm-peach/20 border-solid'
                      : 'border-gray-300 hover:border-warm-peach hover:bg-warm-peach/5'
                  }
                `}
              >
                {formData.petPhoto ? (
                  <div>
                    <Check className="w-8 h-8 text-warm-peach mx-auto mb-2" />
                    <p className="text-sm font-medium text-charcoal-frame">
                      {formData.petPhoto.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Click to change photo
                    </p>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      JPG, PNG up to 10MB
                    </p>
                  </div>
                )}
              </div>

              <input
                ref={petInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, 'pet');
                }}
              />
            </div>
          )}

          {/* Step 3: Contact Info */}
          {currentStep === 3 && !processing && (
            <div>
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-french-blue/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">✨</span>
                </div>
                <h2 className="text-xl font-playfair font-bold text-charcoal-frame mb-2">
                  Almost Ready!
                </h2>
                <p className="text-gray-600 text-sm">
                  We'll email you when your Renaissance masterpiece is ready
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal-frame mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mona-gold focus:border-transparent"
                    placeholder="Enter your name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal-frame mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mona-gold focus:border-transparent"
                    placeholder="Enter your email"
                  />
                </div>

                <div className="bg-gallery-white p-4 rounded-lg">
                  <p className="text-xs text-gray-600">
                    <strong>What happens next:</strong> Our AI artist will create your custom Mona Lisa portrait and email it to you within 24 hours. You'll then choose your preferred format (digital, canvas, framed, etc.).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Processing State */}
          {processing && (
            <div className="text-center py-8">
              <div className="mb-6">
                {processing.step === 'error' ? (
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                ) : (
                  <div className="w-12 h-12 bg-mona-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <div className="w-6 h-6 border-2 border-mona-gold/30 border-t-mona-gold rounded-full animate-spin" />
                  </div>
                )}
                
                <h2 className="text-xl font-playfair font-bold text-charcoal-frame mb-2">
                  {processing.step === 'error' ? 'Oops!' : 'Creating Your Masterpiece'}
                </h2>
                
                <p className="text-gray-600 text-sm mb-4">
                  {processing.message}
                </p>
                
                {processing.step !== 'error' && (
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                    <div 
                      className="bg-mona-gold h-2 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${processing.progress}%` }}
                    />
                  </div>
                )}
                
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                    <p className="text-red-700 text-sm">{error}</p>
                    <button
                      onClick={() => {
                        setProcessing(null);
                        setError(null);
                      }}
                      className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          {!processing && (
            <div className="flex items-center justify-between mt-8">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors
                ${currentStep === 1 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-charcoal-frame hover:bg-gray-100'
                }
              `}
            >
              <ArrowLeft size={16} />
              Back
            </button>

            {currentStep < 3 ? (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className={`
                  flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors
                  ${canProceed()
                    ? 'bg-mona-gold text-charcoal-frame hover:bg-yellow-600'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                Next
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canProceed() || isSubmitting}
                className={`
                  flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors
                  ${canProceed() && !isSubmitting
                    ? 'bg-mona-gold text-charcoal-frame hover:bg-yellow-600'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-charcoal-frame/30 border-t-charcoal-frame rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Create My Masterpiece
                    <Check size={16} />
                  </>
                )}
              </button>
            )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
