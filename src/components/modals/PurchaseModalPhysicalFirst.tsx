// src/components/modals/PurchaseModalPhysicalFirst.tsx
'use client';

import React, { useState } from 'react';
import { X, Image, Frame, Gift, Download } from 'lucide-react';
import { ProductType, getProductPricing } from '@/lib/printify-products';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY 
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

interface PurchaseModalPhysicalFirstProps {
  isOpen: boolean;
  onClose: () => void;
  artwork: {
    id: string;
    generated_image_url: string;
    customer_name: string;
    customer_email: string;
    pet_name?: string;
  };
}

export const PurchaseModalPhysicalFirst = ({ isOpen, onClose, artwork }: PurchaseModalPhysicalFirstProps) => {
  const [selectedProduct, setSelectedProduct] = useState<{ type: ProductType; size: string } | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  if (!isOpen) return null;

  const handlePurchase = async (productType: ProductType, size: string) => {
    setIsCheckingOut(true);
    
    // Demo mode - just show alert instead of real checkout
    if (!stripePromise) {
      setTimeout(() => {
        alert(`Demo: Would purchase ${productType} (${size}) for ${artwork.customer_name}\nVariant: Physical-First`);
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
          imageUrl: artwork.generated_image_url,
          variant: 'physical-first' // For A/B testing analytics
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

  const physicalProducts = [
    {
      type: ProductType.ART_PRINT,
      size: '16x20',
      icon: Image,
      title: 'Premium Art Print',
      subtitle: 'Perfect for Framing',
      description: 'Museum-quality paper that brings out every detail',
      price: getProductPricing(ProductType.ART_PRINT, '16x20', 'US'),
      originalPrice: null,
      features: ['Museum-quality archival paper', 'Fade-resistant professional inks', 'Ready to frame'],
      delivery: '3-5 business days',
      popular: false
    },
    {
      type: ProductType.FRAMED_CANVAS,
      size: '16x20',
      icon: Frame,
      title: 'Framed Canvas',
      subtitle: 'Gallery-Ready Gift',
      description: 'Stretched canvas with premium frame - ready to hang',
      price: getProductPricing(ProductType.FRAMED_CANVAS, '16x20', 'US'),
      originalPrice: getProductPricing(ProductType.FRAMED_CANVAS, '16x20', 'US') + 2000, // Show savings
      features: ['Gallery-wrapped stretched canvas', 'Premium wooden frame', 'Hanging hardware included'],
      delivery: '5-7 business days',
      popular: true
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-playfair font-bold text-charcoal-frame">
              The Perfect Gift
            </h2>
            <p className="text-gray-600 mt-1">
              Choose your masterpiece format
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {/* Artwork Preview with Gift Context */}
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <img 
                src={artwork.generated_image_url}
                alt="Your masterpiece"
                className="w-40 h-40 rounded-lg object-cover shadow-lg"
              />
              <div className="absolute -top-2 -right-2">
                <Gift className="w-8 h-8 text-mona-gold" />
              </div>
            </div>
            <h3 className="text-xl font-playfair font-bold text-charcoal-frame mt-4">
              {artwork.customer_name}{artwork.pet_name ? ` & ${artwork.pet_name}` : ''} Masterpiece
            </h3>
            <p className="text-gray-600">A gift that will be treasured forever</p>
          </div>

          {/* Two Main Physical Options */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {physicalProducts.map((product) => {
              const Icon = product.icon;
              const isSelected = selectedProduct?.type === product.type;
              
              return (
                <div
                  key={product.type}
                  className={`relative border-2 rounded-lg p-6 cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-mona-gold bg-mona-gold/5 shadow-lg' 
                      : product.popular
                      ? 'border-mona-gold/50 shadow-md'
                      : 'border-gray-200 hover:border-mona-gold/30 hover:shadow-md'
                  }`}
                  onClick={() => setSelectedProduct({ type: product.type, size: product.size })}
                >
                  {/* Popular Badge */}
                  {product.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-mona-gold text-white text-xs font-bold px-3 py-1 rounded-full">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="text-center">
                    <Icon className={`w-16 h-16 mx-auto mb-4 ${product.popular ? 'text-mona-gold' : 'text-gray-600'}`} />
                    
                    <h3 className="text-2xl font-playfair font-bold text-charcoal-frame mb-2">
                      {product.title}
                    </h3>
                    <p className="text-lg text-gray-600 mb-2">{product.subtitle}</p>
                    <p className="text-sm text-gray-500 mb-4">{product.description}</p>
                    
                    <div className="mb-4">
                      {product.originalPrice && (
                        <div className="text-lg text-gray-400 line-through">
                          {formatPrice(product.originalPrice)}
                        </div>
                      )}
                      <div className="text-4xl font-bold text-mona-gold">
                        {formatPrice(product.price)}
                      </div>
                      {product.originalPrice && (
                        <div className="text-sm text-green-600 font-medium">
                          Save {formatPrice(product.originalPrice - product.price)}
                        </div>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-500 mb-4">Ships in {product.delivery}</p>
                    
                    <ul className="text-sm text-gray-600 space-y-2 mb-6">
                      {product.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center">
                          <div className="w-2 h-2 bg-mona-gold rounded-full mr-3 flex-shrink-0"></div>
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {/* Free Digital Copy Highlight */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                      <div className="flex items-center justify-center text-green-700">
                        <Download size={16} className="mr-2" />
                        <span className="font-medium text-sm">Free digital copy included</span>
                      </div>
                      <p className="text-xs text-green-600 mt-1">
                        High-res file for printing additional copies
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Purchase Button */}
          {selectedProduct && (
            <div className="text-center">
              <button
                onClick={() => handlePurchase(selectedProduct.type, selectedProduct.size)}
                disabled={isCheckingOut}
                className={`btn btn-primary btn-lg px-12 ${isCheckingOut ? 'loading' : ''}`}
              >
                {isCheckingOut ? 'Processing...' : 'Order My Masterpiece'}
              </button>
              <p className="text-xs text-gray-500 mt-2">
                ✓ Free shipping • ✓ 30-day guarantee • ✓ Digital copy included
              </p>
            </div>
          )}

          {/* Digital-Only Option (Small) */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                Just want the digital file?
              </p>
              <button
                onClick={() => handlePurchase(ProductType.DIGITAL, 'digital')}
                disabled={isCheckingOut}
                className="text-mona-gold hover:text-mona-gold/80 font-medium text-sm underline"
              >
                Download digital copy only - {formatPrice(getProductPricing(ProductType.DIGITAL, 'digital', 'US'))}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
