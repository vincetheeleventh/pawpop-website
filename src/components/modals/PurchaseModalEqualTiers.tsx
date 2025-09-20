// src/components/modals/PurchaseModalEqualTiers.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Download, Frame, Star, Check, FileImage } from 'lucide-react';
import { Artwork } from '@/lib/supabase';
import { createCheckoutSession } from '@/lib/stripe-client';
import { ProductType, getProductPricing } from '@/lib/printify-products';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY 
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

interface PurchaseModalEqualTiersProps {
  isOpen: boolean;
  onClose: () => void;
  artwork: {
    id: string;
    generated_images?: {
      artwork_preview?: string;
      artwork_full_res?: string;
    };
    customer_name: string;
    customer_email: string;
    pet_name?: string;
  };
}

export const PurchaseModalEqualTiers = ({ isOpen, onClose, artwork }: PurchaseModalEqualTiersProps) => {
  const [selectedOption, setSelectedOption] = useState<{ type: ProductType; size: string } | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  if (!isOpen) return null;

  const handlePurchase = async (productType: ProductType, size: string) => {
    setIsCheckingOut(true);
    
    // Demo mode - just show alert instead of real checkout
    if (!stripePromise) {
      setTimeout(() => {
        alert(`Demo: Would purchase ${productType} (${size}) for ${artwork.customer_name}\nVariant: Equal-Tiers`);
        setIsCheckingOut(false);
      }, 1000);
      return;
    }

    try {
      const response = await fetch('/api/checkout/artwork', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artworkId: artwork.id,
          productType,
          size,
          customerEmail: artwork.customer_email,
          customerName: artwork.customer_name,
          petName: artwork.pet_name,
          imageUrl: artwork.generated_images?.artwork_preview || artwork.generated_images?.artwork_full_res || '',
          variant: 'equal-tiers' // For A/B testing analytics
        })
      });

      if (!response.ok) throw new Error('Checkout failed');

      const { sessionId } = await response.json();
      const stripe = await stripePromise;
      
      if (!stripe) throw new Error('Stripe failed to load');

      await stripe.redirectToCheckout({ sessionId });
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setIsCheckingOut(false);
    }
  };

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const tiers = [
    {
      type: ProductType.DIGITAL,
      size: 'digital',
      icon: Download,
      title: 'Digital Download',
      subtitle: 'Print it Yourself',
      description: 'High-resolution file (4000x4000px)',
      price: getProductPricing(ProductType.DIGITAL, 'digital', 'US'),
      features: ['Instant delivery', 'Print unlimited copies', 'Multiple formats included'],
      delivery: 'Instant',
      badge: null
    },
    {
      type: ProductType.ART_PRINT,
      size: '18x24',
      icon: FileImage,
      title: 'Premium Art Print',
      subtitle: 'Museum Quality',
      description: 'Professional print on premium paper',
      price: getProductPricing(ProductType.ART_PRINT, '18x24', 'US'),
      features: ['Museum-quality paper', 'Ready to frame', 'Fade-resistant inks'],
      delivery: '3-5 days',
      badge: 'Best Value'
    },
    {
      type: ProductType.CANVAS_FRAMED,
      size: '18x24',
      icon: Frame,
      title: 'Framed Canvas',
      subtitle: 'Gallery Ready',
      description: 'Stretched canvas with premium frame',
      price: getProductPricing(ProductType.CANVAS_FRAMED, '18x24', 'US'),
      features: ['Gallery-wrapped canvas', 'Premium wood frame', 'Hanging hardware included'],
      delivery: '5-7 days',
      badge: null
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-playfair font-bold text-charcoal-frame">
              Choose Your Format
            </h2>
            <p className="text-gray-600 mt-1">
              {artwork.customer_name}{artwork.pet_name ? ` & ${artwork.pet_name}` : ''} Masterpiece
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {/* Artwork Preview */}
          <div className="flex justify-center mb-8">
            <Image 
              src={artwork.generated_images?.artwork_preview || artwork.generated_images?.artwork_full_res || '/images/placeholder.jpg'}
              alt="Your masterpiece"
              width={128}
              height={128}
              quality={85}
              sizes="128px"
              className="w-32 h-32 rounded-lg object-cover shadow-lg"
            />
          </div>

          {/* Three-Column Pricing Table */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {tiers.map((tier, index) => {
              const Icon = tier.icon;
              const isSelected = selectedOption?.type === tier.type;
              const isBestValue = tier.badge === 'Best Value';
              
              return (
                <div
                  key={tier.type}
                  className={`relative border-2 rounded-lg p-6 cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-mona-gold bg-mona-gold/5 shadow-lg' 
                      : isBestValue
                      ? 'border-mona-gold/50 shadow-md'
                      : 'border-gray-200 hover:border-mona-gold/30 hover:shadow-md'
                  }`}
                  onClick={() => setSelectedOption({ type: tier.type, size: tier.size })}
                >
                  {/* Best Value Badge */}
                  {tier.badge && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-mona-gold text-white text-xs font-bold px-3 py-1 rounded-full">
                        {tier.badge}
                      </span>
                    </div>
                  )}

                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="absolute top-4 right-4">
                      <div className="w-6 h-6 bg-mona-gold rounded-full flex items-center justify-center">
                        <Check size={16} className="text-white" />
                      </div>
                    </div>
                  )}

                  <div className="text-center">
                    <Icon className={`w-12 h-12 mx-auto mb-4 ${isBestValue ? 'text-mona-gold' : 'text-gray-600'}`} />
                    
                    <h3 className="text-xl font-playfair font-bold text-charcoal-frame mb-1">
                      {tier.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">{tier.subtitle}</p>
                    <p className="text-sm text-gray-500 mb-4">{tier.description}</p>
                    
                    <div className="text-3xl font-bold text-mona-gold mb-2">
                      {formatPrice(tier.price)}
                    </div>
                    <p className="text-xs text-gray-500 mb-4">Ships in {tier.delivery}</p>
                    
                    <ul className="text-sm text-gray-600 space-y-1 mb-4">
                      {tier.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center justify-center">
                          <Check size={14} className="text-green-500 mr-2 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Purchase Button */}
          {selectedOption && (
            <div className="text-center">
              <button
                onClick={() => handlePurchase(selectedOption.type, selectedOption.size)}
                disabled={isCheckingOut}
                className={`btn btn-primary btn-lg px-12 ${isCheckingOut ? 'loading' : ''}`}
              >
                {isCheckingOut ? 'Processing...' : 'Get My Masterpiece'}
              </button>
              <p className="text-xs text-gray-500 mt-2">
                Secure checkout • 30-day money-back guarantee
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
