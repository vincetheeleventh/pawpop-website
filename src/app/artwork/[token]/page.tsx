// src/app/artwork/[token]/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { PurchaseModalRouter, getModalVariant, trackModalVariant, type ModalVariant } from '@/components/modals/PurchaseModalRouter';
import { PurchaseModalPhysicalFirst } from '@/components/modals/PurchaseModalPhysicalFirst';
import MockupDisplay from '@/components/artwork/MockupDisplay';
import ProductPurchaseModal from '@/components/modals/ProductPurchaseModal';

interface Mockup {
  type: string;
  title: string;
  description: string;
  mockupUrl: string;
  productId: string;
  size: string;
}

interface Artwork {
  id: string;
  generated_image_url: string;
  pet_name?: string;
  customer_name: string;
  customer_email: string;
  generation_step: string;
  generated_images?: {
    artwork_preview?: string;
    artwork_full_res?: string;
  };
  processing_status?: Record<string, any>;
}

export default function ArtworkPage({ params }: { params: { token: string } }) {
  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProductType, setSelectedProductType] = useState<string>('');
  const [selectedProductMockups, setSelectedProductMockups] = useState<Mockup[]>([]);
  const [modalVariant, setModalVariant] = useState<ModalVariant>('equal-tiers');
  const [isManualApprovalEnabled, setIsManualApprovalEnabled] = useState<boolean>(false);
  const router = useRouter();

  // Fetch manual approval status
  const fetchReviewStatus = async () => {
    try {
      const response = await fetch('/api/admin/review-status');
      const data = await response.json();
      if (data.success) {
        setIsManualApprovalEnabled(data.humanReviewEnabled);
      }
    } catch (error) {
      console.error('Failed to fetch review status:', error);
      // Default to false on error
      setIsManualApprovalEnabled(false);
    }
  };

  useEffect(() => {
    fetchArtwork();
    fetchReviewStatus();
    // Use physical-first variant for artwork pages
    setModalVariant('physical-first');
    
    // Track artwork page view conversion
    if (typeof window !== 'undefined') {
      import('@/lib/google-ads').then(({ trackArtworkView }) => {
        trackArtworkView(params.token, 2); // $2 CAD engagement value
      });
    }
  }, [params.token]);

  const fetchArtwork = async () => {
    try {
      const response = await fetch(`/api/artwork/${params.token}`);
      if (!response.ok) {
        throw new Error('Artwork not found or link expired');
      }
      const data = await response.json();
      setArtwork(data.artwork);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load artwork');
    } finally {
      setLoading(false);
    }
  };

  const handleGetMasterpiece = () => {
    if (!artwork) return;
    
    // Track modal open event for A/B testing
    trackModalVariant(modalVariant, 'modal_opened', {
      artwork_id: artwork.id,
      customer_name: artwork.customer_name
    });
    
    setShowPurchaseModal(true);
  };

  const handleCloseModal = () => {
    // Track modal close event
    trackModalVariant(modalVariant, 'modal_closed');
    setShowPurchaseModal(false);
  };

  const handleProductClick = (productType: string, mockups: Mockup[]) => {
    setSelectedProductType(productType);
    setSelectedProductMockups(mockups);
    setShowProductModal(true);
  };

  const handleCloseProductModal = () => {
    setShowProductModal(false);
    setSelectedProductType('');
    setSelectedProductMockups([]);
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-mona-gold/20 to-charcoal-frame/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-mona-gold mx-auto mb-4"></div>
          <p className="text-charcoal-frame font-playfair text-xl">Loading your masterpiece...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-mona-gold/20 to-charcoal-frame/10 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">🎨</div>
          <h1 className="text-2xl font-playfair font-bold text-charcoal-frame mb-4">Oops!</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => router.push('/')}
            className="btn btn-primary"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  if (!artwork) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-mona-gold/20 to-charcoal-frame/10 flex items-center justify-center">
        <div className="text-center">
          <p className="text-charcoal-frame font-playfair text-xl">Artwork not found</p>
        </div>
      </div>
    );
  }

  // Check generation step for completion status
  const isCompleted = artwork.generation_step === 'completed';
  
  if (!isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-mona-gold/20 to-charcoal-frame/10 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-6xl mb-4">✨</div>
          <h1 className="text-2xl font-playfair font-bold text-charcoal-frame mb-4">
            {isManualApprovalEnabled ? 'Artwork Submitted!' : 'Artwork Confirmed!'}
          </h1>
          <p className="text-gray-600 mb-4">
            Thank you! We've received your photos and started creating your masterpiece. 
          </p>
          {isManualApprovalEnabled ? (
            <>
              <p className="text-gray-600 mb-6">
                <strong>We'll review your artwork</strong> and email you when it's ready! This ensures the highest quality for your masterpiece.
              </p>
              <button 
                onClick={fetchArtwork}
                className="btn btn-primary mb-4"
              >
                Check Status
              </button>
              <p className="text-sm text-gray-500">
                You will receive your artwork within 24 hours.
              </p>
            </>
          ) : (
            <>
              <p className="text-gray-600 mb-6">
                <strong>Check your email</strong> - we've sent you a confirmation with all the details. Your artwork will be ready shortly!
              </p>
              <button 
                onClick={fetchArtwork}
                className="btn btn-primary mb-4"
              >
                Check if Ready
              </button>
              <p className="text-sm text-gray-500">
                This usually takes just a few minutes to complete.
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-mona-cream to-white">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-playfair font-bold text-charcoal-frame mb-2">
              Your Masterpiece is Ready!
            </h1>
            <p className="text-lg text-gray-600">
              Your personalized Renaissance masterpiece
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            {/* 2-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Left Column: Artwork Display */}
              <div className="bg-white rounded-lg shadow-lg p-8">
                <div className="mb-6">
                  <div className="bg-gray-100 rounded-lg overflow-hidden mb-4">
                    <img 
                      src={artwork.generated_images?.artwork_preview || artwork.generated_images?.artwork_full_res || artwork.generated_image_url}
                      alt="Your PawPop Masterpiece"
                      className="w-full h-auto object-contain"
                    />
                  </div>
                </div>

              </div>

              {/* Right Column: Product Mockups */}
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h3 className="text-xl font-playfair font-semibold text-charcoal-frame mb-6">
                  Make Your Masterpiece Real
                </h3>
                
                <MockupDisplay artwork={artwork} onProductClick={handleProductClick} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* A/B Test Modal */}
      {artwork && (
        <PurchaseModalRouter
          isOpen={showPurchaseModal}
          onClose={handleCloseModal}
          variant={modalVariant}
          artwork={artwork}
        />
      )}

      {/* Product-Specific Purchase Modal */}
      {artwork && (
        <ProductPurchaseModal
          isOpen={showProductModal}
          onClose={handleCloseProductModal}
          productType={selectedProductType}
          mockups={selectedProductMockups}
          artwork={artwork}
          onProductClick={handleProductClick}
        />
      )}
    </>
  );
}
