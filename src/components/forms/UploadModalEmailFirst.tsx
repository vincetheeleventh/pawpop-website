'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, ArrowRight, Check, Camera, AlertCircle, Clock, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import usePlausibleTracking from '@/hooks/usePlausibleTracking';
import useClarityTracking from '@/hooks/useClarityTracking';
import { 
  validateUploadFile, 
  ensureFileObject, 
  withRetry, 
  withTimeout, 
  UploadError,
  checkBrowserSupport,
  validateFileContent,
} from '@/lib/upload-validation';
import {
  getMemoryInfo,
  falAiCircuitBreaker,
  requestDeduplicator,
  uploadQueue,
  verifyImageIntegrity,
  deepSecurityScan,
  getBrowserInfo,
  uploadProgressTracker,
  emergencyCleanup
} from '@/lib/upload-resilience';

interface UploadModalEmailFirstProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  petMomPhoto: File | Blob | null;
  petPhoto: File | Blob | null;
  name: string;
  email: string;
}

type FlowStep = 'email-capture' | 'upload-choice' | 'photo-upload' | 'processing' | 'complete';

interface ProcessingState {
  step: 'uploading' | 'generating' | 'saving' | 'complete' | 'error';
  message: string;
  progress: number;
}

export const UploadModalEmailFirst = ({ isOpen, onClose }: UploadModalEmailFirstProps) => {
  const [flowStep, setFlowStep] = useState<FlowStep>('email-capture');
  const [formData, setFormData] = useState<FormData>({
    petMomPhoto: null,
    petPhoto: null,
    name: '',
    email: ''
  });
  const [artworkId, setArtworkId] = useState<string | null>(null);
  const [uploadToken, setUploadToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processing, setProcessing] = useState<ProcessingState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState<{ petMom: boolean; pet: boolean }>({ petMom: false, pet: false });
  const [showPhotoTips, setShowPhotoTips] = useState(false);
  const [showExitIntent, setShowExitIntent] = useState(false);
  const router = useRouter();
  
  // Analytics tracking
  const { trackFunnel, trackInteraction, trackPerformance } = usePlausibleTracking();
  const clarityTracking = useClarityTracking();

  const petMomInputRef = useRef<HTMLInputElement>(null);
  const petInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

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
      trackInteraction.modalOpen('Upload Modal - Email First');
      clarityTracking.trackFunnel.uploadModalOpened();
    }
  }, [isOpen]);

  // Exit intent detection (only on email capture step)
  useEffect(() => {
    if (!isOpen || flowStep !== 'email-capture' || artworkId) return;

    const handleMouseLeave = (e: MouseEvent) => {
      // Detect when mouse leaves at top of viewport (user trying to close)
      if (e.clientY <= 0 && !showExitIntent) {
        setShowExitIntent(true);
        trackInteraction.buttonClick('Exit Intent Triggered', 'email-capture');
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [isOpen, flowStep, artworkId, showExitIntent]);

  if (!isOpen) return null;

  // Handle email capture and artwork creation
  const handleEmailCapture = async () => {
    if (!formData.name || !formData.email) {
      setError('Please enter your name and email');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Track email capture
      trackFunnel.emailCaptured();
      trackInteraction.formStart('Email Capture Form');
      trackInteraction.formComplete('Email Capture Form');
      clarityTracking.trackInteraction.formStarted('email_capture');
      clarityTracking.trackInteraction.formCompleted('email_capture');

      // Create artwork record with email captured
      const createResponse = await fetch('/api/artwork/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: formData.name,
          customer_email: formData.email,
          email_captured_at: new Date().toISOString(),
          upload_deferred: false // Will be set to true if they choose "Upload Later"
        }),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData.error || 'Failed to create artwork record');
      }
      
      const { artwork, access_token } = await createResponse.json();
      setArtworkId(artwork.id);

      // Generate upload token for deferred uploads
      const tokenResponse = await fetch('/api/artwork/generate-upload-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artworkId: artwork.id }),
      });

      if (!tokenResponse.ok) {
        const tokenError = await tokenResponse.json();
        throw new Error(tokenError.error || 'Failed to generate upload token');
      }
      
      const { uploadToken: token } = await tokenResponse.json();
      setUploadToken(token);
      
      console.log('✅ Email captured, artwork created:', artwork.id, 'Upload token:', token);

      // Move to upload choice step
      setFlowStep('upload-choice');

    } catch (error) {
      console.error('❌ Error capturing email:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        fullError: error
      });
      setError(error instanceof Error ? error.message : 'Failed to save your information');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle "Upload Now" choice
  const handleUploadNow = () => {
    setFlowStep('photo-upload');
    trackInteraction.buttonClick('Upload Now', 'upload-choice');
    clarityTracking.trackInteraction.buttonClick('upload_now', 'upload-choice');
  };

  // Handle "Upload Later" choice
  const handleUploadLater = async () => {
    console.log('🕒 Upload Later clicked', { artworkId, uploadToken });
    
    if (!artworkId || !uploadToken) {
      setError('Missing artwork information');
      console.error('❌ Missing artwork info:', { artworkId, uploadToken });
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Mark artwork as deferred
      await fetch('/api/artwork/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artwork_id: artworkId,
          upload_deferred: true
        })
      });

      // Send confirmation email with upload link
      const uploadUrl = `${window.location.origin}/upload/${uploadToken}`;
      await fetch('/api/email/capture-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: formData.name,
          customerEmail: formData.email,
          uploadUrl
        })
      });

      trackInteraction.buttonClick('Upload Later', 'upload-choice');
      trackFunnel.deferredUpload();
      trackInteraction.formComplete('Deferred Upload Choice');
      clarityTracking.trackInteraction.buttonClick('upload_later', 'upload-choice');
      clarityTracking.trackInteraction.formCompleted('deferred_upload');

      console.log('✅ Upload Later successful - showing completion message');

      // Show success message
      setFlowStep('complete');
      setProcessing({
        step: 'complete',
        message: 'Perfect! We\'ve sent you an email with a link to upload your photos whenever you\'re ready.',
        progress: 100
      });

      // Close modal after 5 seconds
      setTimeout(() => {
        console.log('⏰ Auto-closing modal');
        onClose();
      }, 5000);

    } catch (error) {
      console.error('Error handling deferred upload:', error);
      setError('Failed to save your preference. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // File upload handler (reused from original UploadModal)
  const handleFileUpload = async (file: File, type: 'petMom' | 'pet') => {
    let processedFile = file;
    const uploadId = `${type}-${Date.now()}`;
    
    try {
      // Memory check
      const memoryInfo = getMemoryInfo();
      if (memoryInfo.isLowMemory) {
        setError(`Your device is low on memory (${memoryInfo.usagePercent}% used). Please close other tabs and try again.`);
        return;
      }
      
      // Browser support check
      const browserSupport = checkBrowserSupport();
      if (!browserSupport.supported) {
        setError(`Your browser doesn't support required features: ${browserSupport.missing.join(', ')}. Please use a modern browser.`);
        return;
      }
      
      // Validate file
      const validation = validateUploadFile(file, {
        maxSizeMB: 50,
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
        requireName: true
      });
      
      if (!validation.isValid) {
        setError(validation.error!);
        return;
      }
      
      // Security scan
      const isSecure = await deepSecurityScan(file);
      if (!isSecure) {
        setError('The uploaded file failed security validation. Please try a different image.');
        return;
      }
      
      // Track progress
      uploadProgressTracker.track(uploadId, (progress) => {
        console.log(`📊 Upload progress ${uploadId}: ${progress}%`);
      });
      
      uploadProgressTracker.updateProgress(uploadId, 10);
      
      const fileSizeMB = file.size / (1024 * 1024);
      console.log('📱 File upload details:', {
        name: file.name,
        type: file.type,
        sizeMB: fileSizeMB.toFixed(2),
        uploadType: type
      });
      
      // Check for HEIC/HEIF conversion
      const needsHeicConversion = file.type === 'image/heic' || file.type === 'image/heif' || 
          file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');
      
      if (needsHeicConversion) {
        console.log('🔄 Converting HEIC/HEIF to JPEG');
        const heic2any = (await import('heic2any')).default;
        const convertedBlob = await heic2any({
          blob: file,
          toType: 'image/jpeg',
          quality: 0.8
        }) as Blob;
        
        const newFileName = file.name.replace(/\.(heic|heif)$/i, '.jpg');
        processedFile = new File([convertedBlob], newFileName, { type: 'image/jpeg' });
        console.log('✅ HEIC conversion successful');
      }
      
      // Compress if needed
      if (processedFile.size > 3 * 1024 * 1024) {
        console.log('🗜️ Compressing large image');
        const imageCompression = (await import('browser-image-compression')).default;
        
        const compressionOptions = {
          maxSizeMB: 4,
          maxWidthOrHeight: 2048,
          useWebWorker: true,
          fileType: 'image/jpeg',
          initialQuality: 0.85
        };
        
        const compressedFile = await imageCompression(processedFile, compressionOptions);
        
        uploadProgressTracker.updateProgress(uploadId, 80);
        const isIntegrityValid = await verifyImageIntegrity(compressedFile, file);
        
        if (isIntegrityValid) {
          processedFile = compressedFile;
          console.log('✅ Image compression successful');
        }
      }
      
      // Update form data
      if (type === 'petMom') {
        setFormData(prev => ({ ...prev, petMomPhoto: processedFile }));
      } else {
        setFormData(prev => ({ ...prev, petPhoto: processedFile }));
      }
      
      // Track upload
      trackFunnel.photoUploaded(file.size, file.type);
      trackInteraction.featureUsed('Photo Upload', {
        file_type: file.type,
        file_size_mb: Math.round(file.size / 1024 / 1024 * 100) / 100,
        upload_type: type,
        converted_from_heic: needsHeicConversion
      });
      clarityTracking.trackFunnel.photoUploaded(file.type, file.size);
      
      uploadProgressTracker.updateProgress(uploadId, 100);
      uploadProgressTracker.complete(uploadId);
      
    } catch (error) {
      console.error('❌ File upload failed:', error);
      setError(error instanceof Error ? error.message : 'File upload failed');
      uploadProgressTracker.complete(uploadId);
      
      const memoryInfo = getMemoryInfo();
      if (memoryInfo.isLowMemory) {
        emergencyCleanup();
      }
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

  const handleDrop = async (e: React.DragEvent, type: 'petMom' | 'pet') => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(prev => ({ ...prev, [type]: false }));
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => 
      file.type.startsWith('image/') || 
      file.name.toLowerCase().endsWith('.heic') || 
      file.name.toLowerCase().endsWith('.heif')
    );
    
    if (imageFile) {
      await handleFileUpload(imageFile, type);
    }
  };

  // Handle final submission (after photos uploaded)
  const handleSubmit = async () => {
    if (!formData.petMomPhoto || !formData.petPhoto || !artworkId) {
      setError('Please upload both photos');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    setFlowStep('processing');
    
    trackFunnel.artworkGenerationStarted();
    trackInteraction.formStart('Upload Form - Email First');
    clarityTracking.trackFunnel.artworkGenerationStarted();
    
    const startTime = Date.now();
    
    try {
      // Upload source images
      console.log('📤 Uploading source images...');
      
      let petMomPhotoUrl = '';
      let petPhotoUrl = '';
      
      // Upload pet mom photo
      const petMomFormData = new FormData();
      const petMomImage = ensureFileObject(formData.petMomPhoto!, 'pet-mom-photo.jpg');
      petMomFormData.append('image', petMomImage);
      petMomFormData.append('artworkId', artworkId);
      petMomFormData.append('imageType', 'pet_mom_photo');
      
      const petMomUploadResponse = await fetch('/api/upload-source-image', {
        method: 'POST',
        body: petMomFormData
      });
      
      if (petMomUploadResponse.ok) {
        const petMomResult = await petMomUploadResponse.json();
        petMomPhotoUrl = petMomResult.imageUrl;
      }
      
      // Upload pet photo
      const petFormData = new FormData();
      const petImage = ensureFileObject(formData.petPhoto!, 'pet-photo.jpg');
      petFormData.append('image', petImage);
      petFormData.append('artworkId', artworkId);
      petFormData.append('imageType', 'pet_photo');
      
      const petUploadResponse = await fetch('/api/upload-source-image', {
        method: 'POST',
        body: petFormData
      });
      
      if (petUploadResponse.ok) {
        const petResult = await petUploadResponse.json();
        petPhotoUrl = petResult.imageUrl;
      }
      
      // Update artwork with source images
      await fetch('/api/artwork/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artwork_id: artworkId,
          source_images: {
            pet_mom_photo: petMomPhotoUrl,
            pet_photo: petPhotoUrl,
            uploadthing_keys: {}
          },
          generation_step: 'monalisa_generation',
          upload_deferred: false,
          upload_completed_at: new Date().toISOString()
        })
      });
      
      setProcessing({ step: 'generating', message: 'Creating your masterpiece...', progress: 30 });
      
      // Start MonaLisa generation
      const monaLisaFormData = new FormData();
      const imageToUpload = ensureFileObject(formData.petMomPhoto!, 'pet-mom-photo.jpg');
      monaLisaFormData.append('image', imageToUpload);
      monaLisaFormData.append('artworkId', artworkId.toString());
      
      const monaLisaResponse = await withTimeout(
        fetch('/api/monalisa-maker', {
          method: 'POST',
          body: monaLisaFormData
        }),
        30000,
        'MonaLisa generation timed out'
      );

      if (monaLisaResponse.ok) {
        const monaLisaResult = await monaLisaResponse.json();
        const monaLisaImageUrl = monaLisaResult.imageUrl;

        if (monaLisaImageUrl) {
          setProcessing({ step: 'generating', message: 'Adding your pet...', progress: 60 });
          
          // Send confirmation email
          try {
            const artworkUrl = `${window.location.origin}/artwork/${artworkId}`;
            await fetch('/api/email/masterpiece-creating', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                customerName: formData.name,
                customerEmail: formData.email,
                petName: '',
                artworkUrl
              })
            });
          } catch (emailError) {
            console.error('⚠️ Failed to send confirmation email:', emailError);
          }
          
          // Update with MonaLisa result
          await fetch('/api/artwork/update', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              artwork_id: artworkId,
              generated_images: {
                monalisa_base: monaLisaImageUrl
              },
              generation_step: 'pet_integration'
            })
          });

          // Pet Integration
          const petIntegrationFormData = new FormData();
          const portraitResponse = await fetch(monaLisaImageUrl);
          const portraitBlob = await portraitResponse.blob();
          const portraitFile = new File([portraitBlob], 'monalisa-portrait.jpg', { type: 'image/jpeg' });
          petIntegrationFormData.append('portrait', portraitFile);
          petIntegrationFormData.append('artworkId', artworkId.toString());
          
          const petFile = ensureFileObject(formData.petPhoto!, 'pet-photo.jpg');
          petIntegrationFormData.append('pet', petFile);
          
          const petIntegrationResponse = await fetch('/api/pet-integration', {
            method: 'POST',
            body: petIntegrationFormData
          });

          if (petIntegrationResponse.ok) {
            const petIntegrationResult = await petIntegrationResponse.json();
            const finalImageUrl = petIntegrationResult.imageUrl;

            if (finalImageUrl) {
              // Update with final artwork
              await fetch('/api/artwork/update', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  artwork_id: artworkId,
                  generated_image_url: finalImageUrl,
                  generation_step: 'completed'
                })
              });

              // Track artwork generation completion with enhanced user data
              if (typeof window !== 'undefined') {
                const { trackArtworkGeneration } = await import('@/lib/google-ads');
                trackArtworkGeneration(artworkId, 15); // $15 CAD qualified lead value
              }

              // Check if manual approval is enabled before tracking completion
              const generationTime = Math.round((Date.now() - startTime) / 1000);
              
              try {
                const { isHumanReviewEnabled } = await import('@/lib/admin-review');
                
                if (isHumanReviewEnabled()) {
                  // Track generation complete but pending approval
                  trackFunnel.artworkGenerationStarted(); // Use generation started instead of completed
                  trackInteraction.formComplete('Upload Form - Email First - Pending Approval', generationTime);
                  trackPerformance.imageGeneration('Full Artwork Pipeline - Email First - Pending Approval', generationTime, true);
                } else {
                  // Track full completion for automated flow
                  trackFunnel.artworkCompleted(generationTime);
                  trackInteraction.formComplete('Upload Form - Email First', generationTime);
                  trackPerformance.imageGeneration('Full Artwork Pipeline - Email First', generationTime, true);
                }
              } catch {
                // Fallback if admin-review module not available
                trackFunnel.artworkCompleted(generationTime);
                trackInteraction.formComplete('Upload Form - Email First', generationTime);
                trackPerformance.imageGeneration('Full Artwork Pipeline - Email First', generationTime, true);
              }
              
              setProcessing({
                step: 'complete',
                message: 'Your masterpiece is ready! Redirecting...',
                progress: 100
              });

              // Redirect to artwork page
              setTimeout(() => {
                router.push(`/artwork/${artworkId}`);
              }, 2000);
            }
          }
        }
      }

    } catch (error) {
      console.error('Error during artwork generation:', error);
      
      // Track error
      trackInteraction.error('Upload Form Error - Email First', error instanceof Error ? error.message : 'Unknown error');
      trackPerformance.imageGeneration('Full Artwork Pipeline - Email First', Math.round((Date.now() - startTime) / 1000), false);
      clarityTracking.trackInteraction.errorOccurred('upload_form_error_email_first', error instanceof Error ? error.message : 'unknown');
      
      setError(error instanceof Error ? error.message : 'Failed to generate artwork');
      setProcessing({
        step: 'error',
        message: 'Something went wrong. Please try again.',
        progress: 0
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div 
        ref={modalRef}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
          aria-label="Close modal"
        >
          <X className="w-6 h-6 text-gray-600" />
        </button>

        {/* Content based on flow step */}
        <div className="p-8">
          {/* Step 1: Email Capture */}
          {flowStep === 'email-capture' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-arvo font-bold text-text-primary mb-3">
                  Create Your Unique Masterpiece
                </h2>
                <p className="text-lg text-gray-600">
                  Enter your details to get started. You can upload photos now or later!
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Pet Mom's Name *
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-atomic-tangerine focus:ring-2 focus:ring-atomic-tangerine/20 outline-none transition-all"
                    placeholder="Enter pet mom's name"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    id="email-input"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-atomic-tangerine focus:ring-2 focus:ring-atomic-tangerine/20 outline-none transition-all"
                    placeholder="your@email.com"
                    required
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm">{error}</p>
                  </div>
                )}

                <button
                  onClick={handleEmailCapture}
                  disabled={isSubmitting || !formData.name || !formData.email}
                  className="w-full bg-atomic-tangerine hover:bg-atomic-tangerine/90 text-white font-fredoka text-lg py-4 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>

                <p className="text-xs text-center text-gray-500">
                  By continuing, you agree to receive emails about your masterpiece.
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Upload Choice */}
          {flowStep === 'upload-choice' && (
            <div className="space-y-6">
              {/* Back Button */}
              <button
                onClick={() => setFlowStep('email-capture')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
                <span className="text-sm font-medium">Back</span>
              </button>

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-3xl font-arvo font-bold text-text-primary mb-3">
                  Perfect! You're All Set
                </h2>
                <p className="text-lg text-gray-600">
                  Ready to upload your photos now, or would you prefer to do it later?
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Upload Now */}
                <button
                  onClick={handleUploadNow}
                  className="p-6 border-2 border-atomic-tangerine bg-atomic-tangerine/5 rounded-xl hover:bg-atomic-tangerine/10 transition-all group"
                >
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-12 h-12 bg-atomic-tangerine rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-arvo font-bold text-lg text-text-primary">
                      Upload Photos Now
                    </h3>
                    <p className="text-sm text-gray-600">
                      Have your photos ready? Let's create your masterpiece right away! Takes about 3 minutes.
                    </p>
                  </div>
                </button>

                {/* Upload Later */}
                <button
                  onClick={handleUploadLater}
                  disabled={isSubmitting}
                  className="p-6 border-2 border-gray-300 rounded-xl hover:border-pale-azure hover:bg-pale-azure/5 transition-all group"
                >
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-12 h-12 bg-pale-azure rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-arvo font-bold text-lg text-text-primary">
                      I'll Upload Later
                    </h3>
                    <p className="text-sm text-gray-600">
                      Need time to find the perfect photos? We'll email you a link to upload whenever you're ready.
                    </p>
                  </div>
                </button>
              </div>

              {/* Social Proof & Trust Indicators */}
              <div className="space-y-3">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                    <div className="flex -space-x-2">
                      <div className="w-8 h-8 rounded-full bg-atomic-tangerine flex items-center justify-center text-white text-xs font-bold border-2 border-white">
                        😊
                      </div>
                      <div className="w-8 h-8 rounded-full bg-cyclamen flex items-center justify-center text-white text-xs font-bold border-2 border-white">
                        🎨
                      </div>
                      <div className="w-8 h-8 rounded-full bg-pale-azure flex items-center justify-center text-white text-xs font-bold border-2 border-white">
                        ❤️
                      </div>
                    </div>
                    <span className="font-medium">✨ Over 10,000 pet moms have created their masterpieces</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>100% secure</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>No spam, ever</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Money-back guarantee</span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Photo Upload */}
          {flowStep === 'photo-upload' && (
            <div className="space-y-6">
              {/* Back Button */}
              <button
                onClick={() => setFlowStep('upload-choice')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
                <span className="text-sm font-medium">Back</span>
              </button>

              <div className="text-center">
                <h2 className="text-3xl font-arvo font-bold text-text-primary mb-3">
                  Upload Your Photos
                </h2>
                <p className="text-lg text-gray-600 mb-3">
                  Upload a photo of the pet mom and their beloved pet
                </p>
                
                {/* Photo Tips Button */}
                <button
                  onClick={() => setShowPhotoTips(true)}
                  className="inline-flex items-center gap-2 text-sm text-atomic-tangerine hover:text-atomic-tangerine/80 font-medium transition-colors"
                >
                  <Info className="w-4 h-4" />
                  See tips for choosing good photos
                </button>
              </div>

              <div className="space-y-4">
                {/* Pet Mom Photo Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pet Mom Photo *
                  </label>
                  <div
                    onDragOver={(e) => handleDragOver(e, 'petMom')}
                    onDragEnter={(e) => handleDragEnter(e, 'petMom')}
                    onDragLeave={(e) => handleDragLeave(e, 'petMom')}
                    onDrop={(e) => handleDrop(e, 'petMom')}
                    className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                      dragActive.petMom
                        ? 'border-atomic-tangerine bg-atomic-tangerine/10'
                        : formData.petMomPhoto
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-300 hover:border-atomic-tangerine hover:bg-atomic-tangerine/5'
                    }`}
                    onClick={() => petMomInputRef.current?.click()}
                  >
                    {formData.petMomPhoto ? (
                      <div className="space-y-2">
                        <Check className="w-8 h-8 text-green-600 mx-auto" />
                        <p className="text-sm font-medium text-green-700">Photo uploaded!</p>
                        {objectUrls.petMom && (
                          <img src={objectUrls.petMom} alt="Pet mom preview" className="max-h-32 mx-auto rounded-lg" />
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Camera className="w-8 h-8 text-gray-400 mx-auto" />
                        <p className="text-sm text-gray-600">Click or drag photo here</p>
                      </div>
                    )}
                    <input
                      ref={petMomInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, 'petMom');
                      }}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Pet Photo Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pet Photo *
                  </label>
                  <div
                    onDragOver={(e) => handleDragOver(e, 'pet')}
                    onDragEnter={(e) => handleDragEnter(e, 'pet')}
                    onDragLeave={(e) => handleDragLeave(e, 'pet')}
                    onDrop={(e) => handleDrop(e, 'pet')}
                    className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                      dragActive.pet
                        ? 'border-atomic-tangerine bg-atomic-tangerine/10'
                        : formData.petPhoto
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-300 hover:border-atomic-tangerine hover:bg-atomic-tangerine/5'
                    }`}
                    onClick={() => petInputRef.current?.click()}
                  >
                    {formData.petPhoto ? (
                      <div className="space-y-2">
                        <Check className="w-8 h-8 text-green-600 mx-auto" />
                        <p className="text-sm font-medium text-green-700">Photo uploaded!</p>
                        {objectUrls.pet && (
                          <img src={objectUrls.pet} alt="Pet preview" className="max-h-32 mx-auto rounded-lg" />
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Camera className="w-8 h-8 text-gray-400 mx-auto" />
                        <p className="text-sm text-gray-600">Click or drag photo here</p>
                      </div>
                    )}
                    <input
                      ref={petInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, 'pet');
                      }}
                      className="hidden"
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm">{error}</p>
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !formData.petMomPhoto || !formData.petPhoto}
                  className="w-full bg-atomic-tangerine hover:bg-atomic-tangerine/90 text-white font-fredoka text-lg py-4 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Create My Masterpiece
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Processing */}
          {flowStep === 'processing' && processing && (
            <div className="space-y-6 text-center py-8">
              <div className="w-20 h-20 mx-auto">
                {processing.step === 'complete' ? (
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-10 h-10 text-green-600" />
                  </div>
                ) : processing.step === 'error' ? (
                  <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-10 h-10 text-red-600" />
                  </div>
                ) : (
                  <div className="w-20 h-20 border-4 border-atomic-tangerine/30 border-t-atomic-tangerine rounded-full animate-spin" />
                )}
              </div>

              <div>
                <h3 className="text-2xl font-arvo font-bold text-text-primary mb-2">
                  {processing.message}
                </h3>
                {processing.step !== 'complete' && processing.step !== 'error' && (
                  <p className="text-gray-600">This usually takes 2-3 minutes...</p>
                )}
              </div>

              {processing.progress > 0 && processing.step !== 'complete' && (
                <div className="w-full max-w-md mx-auto">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-atomic-tangerine transition-all duration-500"
                      style={{ width: `${processing.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Complete (for deferred uploads) */}
          {flowStep === 'complete' && processing && (
            <div className="space-y-6 text-center py-8">
              <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <Check className="w-10 h-10 text-green-600" />
              </div>

              <div>
                <h3 className="text-2xl font-arvo font-bold text-text-primary mb-2">
                  {processing.message}
                </h3>
                <p className="text-gray-600">Check your email for the upload link!</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Photo Tips Popup */}
      {showPhotoTips && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setShowPhotoTips(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
              aria-label="Close tips"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>

            <div className="p-6">
              <h3 className="text-2xl font-arvo font-bold text-text-primary mb-4 pr-8">
                Tips for Great Photos
              </h3>

              <p className="text-gray-600 mb-6">
                Clear front-facing photo for the best Renaissance transformation
              </p>

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

              <button
                onClick={() => setShowPhotoTips(false)}
                className="w-full bg-atomic-tangerine hover:bg-atomic-tangerine/90 text-white font-fredoka text-lg py-3 px-6 rounded-xl transition-all"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Intent Popup */}
      {showExitIntent && flowStep === 'email-capture' && !artworkId && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative animate-bounce-in">
            <button
              onClick={() => setShowExitIntent(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-naples-yellow rounded-full flex items-center justify-center">
                <span className="text-3xl">🎁</span>
              </div>
              
              <h3 className="text-2xl font-arvo font-bold text-text-primary">
                Wait! Don't Miss Out
              </h3>
              
              <p className="text-gray-600">
                Enter your email and get <span className="font-bold text-atomic-tangerine">10% off</span> your first masterpiece!
              </p>

              <div className="bg-mindaro/10 p-4 rounded-xl border border-mindaro/30">
                <p className="text-sm font-medium text-text-primary">
                  ✨ Plus: We'll email you gorgeous example artworks for inspiration
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowExitIntent(false);
                    trackInteraction.buttonClick('Exit Intent - Dismissed', 'email-capture');
                  }}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-all"
                >
                  No thanks
                </button>
                <button
                  onClick={() => {
                    setShowExitIntent(false);
                    trackInteraction.buttonClick('Exit Intent - Accepted', 'email-capture');
                    // Focus email input
                    document.getElementById('email-input')?.focus();
                  }}
                  className="flex-1 px-4 py-3 bg-atomic-tangerine hover:bg-atomic-tangerine/90 text-white font-fredoka rounded-xl transition-all"
                >
                  Get 10% Off!
                </button>
              </div>

              <p className="text-xs text-gray-500">
                🔒 Your email is safe. We never spam.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
