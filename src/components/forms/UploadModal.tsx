'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, ArrowRight, ArrowLeft, Check, Camera, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import usePlausibleTracking from '@/hooks/usePlausibleTracking';

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
  
  // Plausible tracking
  const { trackFunnel, trackInteraction, trackPerformance, getPriceVariant } = usePlausibleTracking();

  const petMomInputRef = useRef<HTMLInputElement>(null);
  const petInputRef = useRef<HTMLInputElement>(null);

  // Store object URLs for cleanup
  const [objectUrls, setObjectUrls] = useState<{ petMom?: string; pet?: string }>({});

  // Create and cleanup object URLs
  useEffect(() => {
    const newUrls: { petMom?: string; pet?: string } = {};
    
    if (formData.petMomPhoto) {
      newUrls.petMom = URL.createObjectURL(formData.petMomPhoto);
    }
    if (formData.petPhoto) {
      newUrls.pet = URL.createObjectURL(formData.petPhoto);
    }
    
    setObjectUrls(newUrls);
    
    // Cleanup function
    return () => {
      Object.values(newUrls).forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [formData.petMomPhoto, formData.petPhoto]);

  // Track modal opening
  useEffect(() => {
    if (isOpen) {
      trackFunnel.uploadModalOpened();
      trackInteraction.modalOpen('Upload Modal');
    }
  }, [isOpen, trackFunnel, trackInteraction]);

  if (!isOpen) return null;

  const handleFileUpload = (file: File, type: 'petMom' | 'pet') => {
    if (type === 'petMom') {
      setFormData(prev => ({ ...prev, petMomPhoto: file }));
    } else {
      setFormData(prev => ({ ...prev, petPhoto: file }));
    }
    
    // Track photo upload
    trackFunnel.photoUploaded(file.size, file.type);
    trackInteraction.featureUsed('Photo Upload', {
      file_type: file.type,
      file_size_mb: Math.round(file.size / 1024 / 1024 * 100) / 100,
      upload_type: type
    });
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
    
    // Track form submission start
    trackFunnel.artworkGenerationStarted();
    trackInteraction.formStart('Upload Form');
    
    const startTime = Date.now();
    
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

      // Send confirmation email immediately using the artwork ID
      try {
        const artworkUrl = `${window.location.origin}/artwork/${access_token}`;
        const { sendMasterpieceCreatingEmail } = await import('@/lib/email');
        await sendMasterpieceCreatingEmail({
          customerName: formData.name,
          customerEmail: formData.email,
          petName: '',
          artworkUrl
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
      
      // Start background generation using direct API calls (bypassing problematic monalisa-complete)
      const generateArtwork = async () => {
        try {
          // Step 1: Update generation step in artwork record
          await fetch('/api/artwork/update', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              artwork_id: artwork.id,
              generation_step: 'monalisa_generation'
            })
          });

          // Step 2: Call MonaLisa Maker API directly
          const monaLisaFormData = new FormData();
          if (formData.petMomPhoto instanceof File) {
            monaLisaFormData.append('image', formData.petMomPhoto);
            monaLisaFormData.append('artworkId', artwork.id.toString());
          } else {
            // If it's already a URL, send as JSON
            const monaLisaResponse = await fetch('/api/monalisa-maker', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                imageUrl: formData.petMomPhoto,
                artworkId: artwork.id.toString()
              })
            });
            
            if (!monaLisaResponse.ok) {
              throw new Error('MonaLisa generation failed');
            }
            
            const monaLisaResult = await monaLisaResponse.json();
            const monaLisaImageUrl = monaLisaResult.imageUrl;
            
            if (monaLisaImageUrl) {
              // Continue with the rest of the flow...
              await fetch('/api/artwork/update', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  artwork_id: artwork.id,
                  generated_image_url: monaLisaImageUrl,
                  generation_step: 'monalisa_generation'
                })
              });
            }
            return;
          }
          
          const monaLisaResponse = await fetch('/api/monalisa-maker', {
            method: 'POST',
            body: monaLisaFormData
          });

          if (monaLisaResponse.ok) {
            const monaLisaResult = await monaLisaResponse.json();
            const monaLisaImageUrl = monaLisaResult.imageUrl;

            if (monaLisaImageUrl) {
              // Step 3: Update with MonaLisa intermediate result
              await fetch('/api/artwork/update', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  artwork_id: artwork.id,
                  generated_images: {
                    monalisa_base: monaLisaImageUrl
                  },
                  generation_step: 'faceswap'
                })
              });

              // Step 3.5: Perform FaceSwap using ViewComfy
              const faceswapResponse = await fetch('/api/faceswap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  sourceImageUrl: formData.petMomPhoto, // Pet mom photo
                  targetImageUrl: monaLisaImageUrl,     // MonaLisa portrait
                  artworkId: artwork.id.toString()
                })
              });

              let faceswapImageUrl = monaLisaImageUrl; // Fallback to original
              if (faceswapResponse.ok) {
                const faceswapResult = await faceswapResponse.json();
                faceswapImageUrl = faceswapResult.imageUrl;
                
                // Update artwork with faceswap result
                await fetch('/api/artwork/update', {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    artwork_id: artwork.id,
                    generated_images: {
                      monalisa_base: monaLisaImageUrl,
                      faceswap_result: faceswapImageUrl
                    },
                    generation_step: 'pet_integration'
                  })
                });
              } else {
                console.warn('FaceSwap failed, continuing with original MonaLisa portrait');
                // Update step to pet_integration even if faceswap fails
                await fetch('/api/artwork/update', {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    artwork_id: artwork.id,
                    generation_step: 'pet_integration'
                  })
                });
              }

              // Step 4: Call Pet Integration API (using faceswap result or fallback)
              const petIntegrationFormData = new FormData();
              
              // Add the faceswapped portrait (or MonaLisa if faceswap failed)
              const portraitResponse = await fetch(faceswapImageUrl);
              const portraitBlob = await portraitResponse.blob();
              const portraitFile = new File([portraitBlob], 'faceswap-portrait.jpg', { type: 'image/jpeg' });
              petIntegrationFormData.append('portrait', portraitFile);
              petIntegrationFormData.append('artworkId', artwork.id.toString());
              
              // Add the pet image
              if (formData.petPhoto instanceof File) {
                petIntegrationFormData.append('pet', formData.petPhoto);
              } else if (formData.petPhoto) {
                // If it's a URL, fetch and convert to File
                const petResponse = await fetch(formData.petPhoto);
                const petBlob = await petResponse.blob();
                const petFile = new File([petBlob], 'pet-photo.jpg', { type: 'image/jpeg' });
                petIntegrationFormData.append('pet', petFile);
              } else {
                throw new Error('Pet photo is required for pet integration');
              }
              
              const petIntegrationResponse = await fetch('/api/pet-integration', {
                method: 'POST',
                body: petIntegrationFormData
              });

              if (petIntegrationResponse.ok) {
                const petIntegrationResult = await petIntegrationResponse.json();
                const finalImageUrl = petIntegrationResult.imageUrl;

                if (finalImageUrl) {
                  // Step 5: Create admin review for artwork proof (if enabled)
                  try {
                    const { createAdminReview, isHumanReviewEnabled } = await import('@/lib/admin-review');
                    if (isHumanReviewEnabled()) {
                      await createAdminReview({
                        artwork_id: artwork.id,
                        review_type: 'artwork_proof',
                        image_url: finalImageUrl,
                        fal_generation_url: petIntegrationResult.fal_generation_url || undefined,
                        customer_name: formData.name,
                        customer_email: formData.email,
                        pet_name: undefined
                      });
                      console.log('✅ Admin review created for artwork proof');
                    }
                  } catch (reviewError) {
                    console.error('Failed to create admin review:', reviewError);
                    // Don't fail the generation if review creation fails
                  }

                  // Step 6: Update with final completed artwork
                  await fetch('/api/artwork/update', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      artwork_id: artwork.id,
                      generated_image_url: finalImageUrl,
                      generation_step: 'completed'
                    })
                  });

                  // Track artwork generation completion conversion
                  if (typeof window !== 'undefined') {
                    const { trackArtworkGeneration } = await import('@/lib/google-ads');
                    trackArtworkGeneration(artwork.id, 15); // $15 CAD qualified lead value
                  }

                  // Track Plausible completion
                  const generationTime = Math.round((Date.now() - startTime) / 1000);
                  trackFunnel.artworkCompleted(generationTime);
                  trackInteraction.formComplete('Upload Form', generationTime);
                  trackPerformance.imageGeneration('Full Artwork Pipeline', generationTime, true);

                  // Send completion email with the generated image (only if human review is disabled)
                  try {
                    const { isHumanReviewEnabled } = await import('@/lib/admin-review');
                    if (!isHumanReviewEnabled()) {
                      await fetch('/api/email/masterpiece-ready', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          customerName: formData.name,
                          customerEmail: formData.email,
                          artworkUrl: `${window.location.origin}/artwork/${access_token}`,
                          generatedImageUrl: finalImageUrl
                        })
                      });
                      console.log('Completion email sent successfully');
                    } else {
                      console.log('Human review enabled - completion email will be sent after approval');
                      // Show human review message for E2E tests
                      const reviewMessage = document.createElement('div');
                      reviewMessage.setAttribute('data-testid', 'review-pending-message');
                      reviewMessage.className = 'hidden';
                      reviewMessage.textContent = 'Your artwork is pending admin review';
                      document.body.appendChild(reviewMessage);
                    }
                  } catch (emailError) {
                    console.error('Failed to send completion email:', emailError);
                    // Don't fail the process if email fails
                  }
                }
              } else {
                console.error('Pet integration failed:', await petIntegrationResponse.text());
              }
            } else {
              console.error('MonaLisa generation failed - no image URL returned');
            }
          } else {
            console.error('MonaLisa generation failed:', await monaLisaResponse.text());
          }
        } catch (generationError) {
          console.error('Artwork generation failed:', generationError);
        }
      };

      // Start the generation process in the background
      generateArtwork();
      
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
      
      // Track error
      trackInteraction.error('Upload Form Error', error instanceof Error ? error.message : 'Unknown error');
      trackPerformance.imageGeneration('Full Artwork Pipeline', Math.round((Date.now() - startTime) / 1000), false);
      
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
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium font-geist
                  ${currentStep >= step 
                    ? 'bg-naples-yellow text-text-primary' 
                    : 'bg-gray-200 text-gray-400'
                  }
                `}>
                  {currentStep > step ? <Check size={16} /> : step}
                </div>
                {step < 3 && (
                  <div className={`
                    w-16 h-1 mx-2
                    ${currentStep > step ? 'bg-naples-yellow' : 'bg-gray-200'}
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
              {/* Header Section */}
              <div className="mb-6">
                <div className="w-16 h-16 bg-naples-yellow/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-8 h-8 text-naples-yellow" />
                </div>
                <h2 className="text-xl font-arvo font-bold text-text-primary mb-2">
                  Upload Your Photo
                </h2>
                <p className="text-sm font-geist text-gray-600 mb-6">
                  Clear front-facing photo for the best Mona Lisa transformation
                </p>
              </div>

              {/* Visual Guide Section */}
              <div className="mb-6">
                <div className="flex justify-center gap-3 mb-4">
                  <div className="flex-1 max-w-24">
                    <div className="relative">
                      <img 
                        src="/images/user upload instructions/yes.png" 
                        alt="Good photo example" 
                        className="w-full h-auto rounded-xl border-2 border-naples-yellow shadow-sm"
                      />
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-naples-yellow rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-text-primary" />
                      </div>
                    </div>
                    <p className="text-xs font-geist text-naples-yellow mt-2 font-medium">Perfect</p>
                  </div>
                  <div className="flex-1 max-w-24">
                    <div className="relative">
                      <img 
                        src="/images/user upload instructions/no1.png" 
                        alt="Poor photo example 1" 
                        className="w-full h-auto rounded-xl border-2 border-gray-300 opacity-60"
                      />
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
                        <X className="w-3 h-3 text-white" />
                      </div>
                    </div>
                    <p className="text-xs font-geist text-gray-500 mt-2">Side view</p>
                  </div>
                  <div className="flex-1 max-w-24">
                    <div className="relative">
                      <img 
                        src="/images/user upload instructions/no2.png" 
                        alt="Poor photo example 2" 
                        className="w-full h-auto rounded-xl border-2 border-gray-300 opacity-60"
                      />
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
                        <X className="w-3 h-3 text-white" />
                      </div>
                    </div>
                    <p className="text-xs font-geist text-gray-500 mt-2">Too far</p>
                  </div>
                </div>
              </div>

              {/* Tip Section */}
              <div className="mb-6">
                <div className="bg-mindaro/10 p-4 rounded-xl border border-mindaro/20">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-mindaro/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-mindaro text-sm">💡</span>
                    </div>
                    <p className="text-sm font-geist font-medium text-text-primary text-left">
                      Accessories like glasses, hats, and jewelry will be included in your Renaissance masterpiece!
                    </p>
                  </div>
                </div>
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
                    ? 'border-naples-yellow bg-naples-yellow/10' 
                    : dragActive.petMom 
                      ? 'border-naples-yellow bg-naples-yellow/20 border-solid'
                      : 'border-gray-300 hover:border-naples-yellow hover:bg-naples-yellow/5'
                  }
                `}
              >
                {formData.petMomPhoto ? (
                  <div className="flex flex-col items-center">
                    <div className="w-24 h-24 mb-3 rounded-lg overflow-hidden border-2 border-naples-yellow">
                      <img 
                        src={objectUrls.petMom} 
                        alt="Uploaded pet mom photo"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Check className="w-6 h-6 text-naples-yellow mb-2" />
                    <p className="text-xs font-geist text-gray-500">
                      Click to change photo
                    </p>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm font-geist text-gray-600">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs font-geist text-gray-500 mt-1">
                      JPG, PNG, WebP up to 8MB
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
              {/* Header Section */}
              <div className="mb-6">
                <div className="w-16 h-16 bg-atomic-tangerine/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🐕</span>
                </div>
                <h2 className="text-xl font-arvo font-bold text-text-primary mb-2">
                  Upload Your Pet's Photo
                </h2>
                <p className="text-sm font-geist text-gray-600 mb-6">
                  Clear photo of your beloved pet for the best artwork result
                </p>
              </div>

              {/* Tip Section */}
              <div className="mb-6">
                <div className="bg-atomic-tangerine/10 p-4 rounded-xl border border-atomic-tangerine/20">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-atomic-tangerine/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-atomic-tangerine text-sm">🎨</span>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-geist font-medium text-text-primary mb-1">
                        Their expression, pose and accessories will be included in your painting.
                      </p>
                      <p className="text-xs font-geist text-gray-600">
                        Most clear photos work great, but taking a photo just for this painting can be fun!
                      </p>
                    </div>
                  </div>
                </div>
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
                    ? 'border-naples-yellow bg-naples-yellow/10' 
                    : dragActive.pet 
                      ? 'border-naples-yellow bg-naples-yellow/20 border-solid'
                      : 'border-gray-300 hover:border-naples-yellow hover:bg-naples-yellow/5'
                  }
                `}
              >
                {formData.petPhoto ? (
                  <div className="flex flex-col items-center">
                    <div className="w-24 h-24 mb-3 rounded-lg overflow-hidden border-2 border-naples-yellow">
                      <img 
                        src={objectUrls.pet} 
                        alt="Uploaded pet photo"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Check className="w-6 h-6 text-naples-yellow mb-2" />
                    <p className="text-xs font-geist text-gray-500">
                      Click to change photo
                    </p>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm font-geist text-gray-600">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs font-geist text-gray-500 mt-1">
                      JPG, PNG, WebP up to 8MB
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
            <div className="text-center">
              {/* Header Section */}
              <div className="mb-6">
                <div className="w-16 h-16 bg-naples-yellow/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">✨</span>
                </div>
                <h2 className="text-xl font-arvo font-bold text-text-primary mb-2">
                  Almost Ready!
                </h2>
                <p className="text-sm font-geist text-gray-600 mb-6">
                  We'll email you when your Renaissance masterpiece is ready
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2 font-geist">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-naples-yellow focus:border-transparent font-geist"
                    placeholder="Enter your name"
                    data-testid="customer-name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2 font-geist">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-naples-yellow focus:border-transparent font-geist"
                    placeholder="Enter your email"
                    data-testid="customer-email"
                  />
                </div>

                <div className="bg-card-surface p-4 rounded-xl border border-gray-200">
                  <div className="text-center">
                    <p className="text-sm font-geist font-medium text-text-primary mb-1">
                      What happens next:
                    </p>
                    <p className="text-xs font-geist text-gray-600">
                      You'll receive an email with your custom Renaissance masterpiece within 24 hours. Then choose canvas, art print, or digital file.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Processing State */}
          {processing && (
            <div className="text-center py-8" data-testid="generation-status">
              <div className="mb-6">
                {processing.step === 'error' ? (
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                ) : (
                  <div className="w-12 h-12 bg-naples-yellow/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <div className="w-6 h-6 border-2 border-naples-yellow/30 border-t-naples-yellow rounded-full animate-spin" />
                  </div>
                )}
                
                <h2 className="text-xl font-arvo font-bold text-text-primary mb-2">
                  {processing.step === 'error' ? 'Oops!' : 'Creating Your Masterpiece'}
                </h2>
                
                <p className="text-gray-600 text-sm mb-4 font-geist" data-testid="processing-message">
                  {processing.message}
                </p>
                
                {processing.step !== 'error' && (
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                    <div 
                      className="bg-naples-yellow h-2 rounded-full transition-all duration-500 ease-out"
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
                flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors font-geist
                ${currentStep === 1 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-text-primary hover:bg-gray-100'
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
                  flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors font-geist
                  ${canProceed()
                    ? 'bg-naples-yellow text-text-primary hover:bg-naples-yellow/80'
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
                  flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors font-geist
                  ${canProceed() && !isSubmitting
                    ? 'bg-naples-yellow text-text-primary hover:bg-naples-yellow/80'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }
                `}
                data-testid="generate-artwork"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-text-primary/30 border-t-text-primary rounded-full animate-spin" />
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
