// src/app/artwork/[token]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PurchaseModalRouter, getModalVariant, trackModalVariant, type ModalVariant } from '@/components/modals/PurchaseModalRouter';

interface Artwork {
  id: string;
  generated_image_url: string;
  pet_name?: string;
  customer_name: string;
  customer_email: string;
  generation_status: string;
}

export default function ArtworkPage({ params }: { params: { token: string } }) {
  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [modalVariant, setModalVariant] = useState<ModalVariant>('equal-tiers');
  const router = useRouter();

  useEffect(() => {
    fetchArtwork();
    // Set A/B test variant on component mount
    setModalVariant(getModalVariant());
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

  if (artwork.generation_status !== 'completed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-mona-gold/20 to-charcoal-frame/10 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-6xl mb-4">⏳</div>
          <h1 className="text-2xl font-playfair font-bold text-charcoal-frame mb-4">
            Artwork In Progress
          </h1>
          <p className="text-gray-600 mb-6">
            Your masterpiece is still being created. Please check back in a few minutes.
          </p>
          <button 
            onClick={fetchArtwork}
            className="btn btn-primary"
          >
            Refresh
          </button>
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
              {artwork.pet_name ? `${artwork.customer_name} & ${artwork.pet_name}` : artwork.customer_name} in the style of the Mona Lisa
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {/* Artwork Display */}
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="max-w-md mx-auto mb-8">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
                  <img 
                    src={artwork.generated_image_url}
                    alt="Your PawPop Masterpiece"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-sm text-gray-500 italic">
                  "Ah, magnifique! A true Renaissance masterpiece!" - Monsieur Brush
                </p>
              </div>

              {/* CTA Button */}
              <button
                onClick={handleGetMasterpiece}
                className="btn btn-primary btn-lg px-12 text-xl"
              >
                Get My Masterpiece
              </button>
              
              <p className="text-sm text-gray-500 mt-4">
                Choose from digital download, premium prints, or framed canvas
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* A/B Test Modal */}
      <PurchaseModalRouter
        isOpen={showPurchaseModal}
        onClose={handleCloseModal}
        variant={modalVariant}
        artwork={artwork}
      />
    </>
  );
}
