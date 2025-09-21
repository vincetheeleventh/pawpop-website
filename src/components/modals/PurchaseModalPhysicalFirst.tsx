// src/components/modals/PurchaseModalPhysicalFirst.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Gift, Star, Shield, Truck, Frame, Download, FileImage } from 'lucide-react';
import { Artwork } from '@/lib/supabase';
import { createCheckoutSession } from '@/lib/stripe-client';
import { ProductType, getProductPricing, getAvailableSizes } from '@/lib/printify-products';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY 
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

interface Mockup {
  type: string;
  title: string;
  description: string;
  mockupUrl: string;
  productId: string;
  size: string;
}

interface PurchaseModalPhysicalFirstProps {
  isOpen: boolean;
  onClose: () => void;
  artwork: {
    id: string;
    generated_images?: {
      artwork_preview?: string;
      artwork_full_res?: string;
    };
    delivery_images?: {
      mockups?: Record<string, Mockup[]>;
    };
    customer_name: string;
    customer_email: string;
    pet_name?: string;
  };
}

export const PurchaseModalPhysicalFirst = ({ isOpen, onClose, artwork }: PurchaseModalPhysicalFirstProps) => {
  const [selectedProduct, setSelectedProduct] = useState<{ type: ProductType; size: string; frameUpgrade?: boolean } | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('16x24'); // Default to middle size
  const [frameUpgrade, setFrameUpgrade] = useState<boolean>(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  if (!isOpen) return null;

  // Get the appropriate Context 1 mockup for the selected size and product type
  const getMockupForSize = (productType: string, size: string): string => {
    const mockups = artwork.delivery_images?.mockups;
    if (!mockups) {
      // Fallback to artwork image if no mockups available
      return artwork.generated_images?.artwork_preview || artwork.generated_images?.artwork_full_res || '/images/placeholder.jpg';
    }

    // Map product types to mockup keys
    const productTypeMap: Record<string, string> = {
      [ProductType.ART_PRINT]: 'art_print',
      [ProductType.CANVAS_STRETCHED]: 'canvas_stretched', 
      [ProductType.CANVAS_FRAMED]: 'canvas_framed'
    };

    const mockupKey = productTypeMap[productType];
    const productMockups = mockups[mockupKey];
    
    if (productMockups && productMockups.length > 0) {
      // Find mockup for the specific size, fallback to first available
      const sizeMockup = productMockups.find(m => m.size === size);
      const mockup = sizeMockup || productMockups[0];
      return mockup.mockupUrl;
    }

    // Final fallback to artwork image
    return artwork.generated_images?.artwork_preview || artwork.generated_images?.artwork_full_res || '/images/placeholder.jpg';
  };

  // Get the current display image - prioritize canvas products for visual appeal
  const getCurrentDisplayImage = (): string => {
    // Try canvas framed first (most premium), then canvas stretched, then art print
    const preferredOrder = [ProductType.CANVAS_FRAMED, ProductType.CANVAS_STRETCHED, ProductType.ART_PRINT];
    
    for (const productType of preferredOrder) {
      const mockupUrl = getMockupForSize(productType, selectedSize);
      if (mockupUrl !== artwork.generated_images?.artwork_preview && 
          mockupUrl !== artwork.generated_images?.artwork_full_res && 
          mockupUrl !== '/images/placeholder.jpg') {
        return mockupUrl;
      }
    }
    
    // Fallback to artwork image
    return artwork.generated_images?.artwork_preview || artwork.generated_images?.artwork_full_res || '/images/placeholder.jpg';
  };

  const handlePurchase = async (productType: ProductType, size: string, frameUpgrade: boolean = false) => {
    setIsCheckingOut(true);
    
    // Track add to cart and begin checkout events
    if (typeof window !== 'undefined') {
      const { trackAddToCart, trackBeginCheckout } = await import('@/lib/google-ads');
      const price = getProductPricing(productType, size, 'US', frameUpgrade);
      trackAddToCart(productType, price);
      trackBeginCheckout(productType, price);
    }
    
    // Test/Demo mode - simulate the full API flow
    const isTestMode = process.env.NODE_ENV === 'development' || !stripePromise;
    
    if (isTestMode) {
      setTimeout(async () => {
        const productName = productType === 'art_print' ? 'Fine Art Print' : 'Framed Canvas';
        const price = formatPrice(getProductPricing(productType, size, 'US', frameUpgrade));
        
        // Simulate API calls in test mode
        try {
          console.log('🧪 TEST MODE: Simulating checkout API call...');
          
          // Test the actual checkout API endpoint
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
              variant: 'physical-first',
              frameUpgrade,
              testMode: true // Flag for test mode
            })
          });
          
          if (response.ok) {
            const data = await response.json();
            alert(`🎨 TEST MODE - Complete API Flow:

✅ Checkout API called successfully!
✅ Session ID received: ${data.sessionId}

Product: ${productName}
Size: ${size}" (${size === '12x18' ? 'Small' : size === '16x24' ? 'Medium' : 'Large'})
Price: ${price}
Customer: ${artwork.customer_name}${artwork.pet_name ? ` & ${artwork.pet_name}` : ''}

🔧 API Response: ${JSON.stringify(data, null, 2)}

In production: Would redirect to Stripe checkout
Next: Printify would create physical product`);
          } else {
            throw new Error(`API Error: ${response.status}`);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          alert(`❌ TEST MODE - API Error:

Error: ${errorMessage}

This shows the API integration is working.
Check console for detailed error logs.`);
          console.error('Test mode API error:', error);
        }
        
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
          variant: 'physical-first', // For A/B testing analytics
          frameUpgrade
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

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)} CAD`;

  const getProductsWithSizes = () => {
    const countryCode = 'US'; // Default to US, could be dynamic based on user location
    
    return [
      {
        type: ProductType.ART_PRINT,
        title: 'Fine Art Print',
        subtitle: 'Museum-Quality Fine Art Paper',
        description: 'Premium fine art paper (285 g/m²) with archival inks',
        icon: FileImage,
        price: getProductPricing(ProductType.ART_PRINT, selectedSize, countryCode),
        size: selectedSize,
        delivery: '3-5 business days',
        popular: false,
        availableSizes: getAvailableSizes(ProductType.ART_PRINT, countryCode)
      },
      {
        type: ProductType.CANVAS_STRETCHED,
        title: 'Canvas (Stretched)',
        subtitle: 'Premium Matte Canvas',
        description: 'High-quality stretched canvas on 1.25" wooden frame',
        icon: Frame,
        price: getProductPricing(ProductType.CANVAS_STRETCHED, selectedSize, countryCode, frameUpgrade),
        size: selectedSize,
        delivery: '5-7 business days',
        popular: true,
        availableSizes: getAvailableSizes(ProductType.CANVAS_STRETCHED, countryCode),
        hasFrameUpgrade: true,
        frameUpgradePrice: 4000 // $40.00 CAD
      },
      {
        type: ProductType.CANVAS_FRAMED,
        title: 'Canvas (Framed)',
        subtitle: 'Gallery-Ready Gift',
        description: 'Premium framed canvas with multi-color frame - ready to hang',
        icon: Frame,
        price: getProductPricing(ProductType.CANVAS_FRAMED, selectedSize, countryCode),
        size: selectedSize,
        delivery: '7-10 business days',
        popular: false,
        availableSizes: getAvailableSizes(ProductType.CANVAS_FRAMED, countryCode),
        isUpsell: true
      }
    ];
  };

  const products = getProductsWithSizes();

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
          {/* Artwork Preview with Gift Context - Shows Context 1 mockup for selected size */}
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <Image 
                src={getCurrentDisplayImage()}
                alt={`Your masterpiece - ${selectedSize}" preview`}
                width={200}
                height={200}
                quality={85}
                sizes="200px"
                className="w-50 h-50 rounded-lg object-cover shadow-lg transition-all duration-300"
              />
              <div className="absolute -top-2 -right-2">
                <Gift className="w-8 h-8 text-mona-gold" />
              </div>
              {/* Size indicator */}
              <div className="absolute -bottom-2 -left-2 bg-charcoal-frame text-white px-2 py-1 rounded text-xs font-semibold">
                {selectedSize}"
              </div>
            </div>
            <h3 className="text-xl font-playfair font-bold text-charcoal-frame mt-4">
              {artwork.customer_name}{artwork.pet_name ? ` & ${artwork.pet_name}` : ''} Masterpiece
            </h3>
            <p className="text-gray-600">A gift that will be treasured forever</p>
            <p className="text-sm text-gray-500 mt-1">Preview shows how it looks in a room environment</p>
          </div>

          {/* Size Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-charcoal-frame mb-3">Choose Your Size</h3>
            <div className="flex flex-wrap gap-3">
              {['12x18', '16x24', '20x30'].map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    selectedSize === size
                      ? 'border-mona-gold bg-mona-gold text-white'
                      : 'border-gray-300 hover:border-mona-gold'
                  }`}
                >
                  <span className="font-medium">{size}"</span>
                  <span className="text-sm block">{size === '12x18' ? 'Small' : size === '16x24' ? 'Medium' : 'Large'}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Product Options */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {products.map((product) => (
              <div
                key={product.type}
                className={`relative border-2 rounded-lg p-6 cursor-pointer transition-all ${
                  selectedProduct?.type === product.type
                    ? 'border-mona-gold bg-mona-gold/5 shadow-lg'
                    : 'border-mona-gold/50 shadow-md hover:border-mona-gold hover:shadow-lg'
                }`}
                onClick={() => {
                  setSelectedProduct({ type: product.type, size: selectedSize, frameUpgrade });
                  if (product.type !== ProductType.CANVAS_STRETCHED) {
                    setFrameUpgrade(false);
                  }
                }}
              >
                {/* Popular Badge */}
                {product.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-mona-gold text-white text-xs font-bold px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Product Content */}
                <div className="text-center">
                  <product.icon size={32} className="text-mona-gold mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-charcoal-frame">{product.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{product.subtitle}</p>
                  <p className="text-xs text-gray-500 mb-4">{product.description}</p>
                  
                  {/* Price */}
                  <div className="mb-3">
                    <span className="text-2xl font-bold text-charcoal-frame">
                      {formatPrice(product.price)}
                    </span>
                    <span className="text-sm text-gray-500 ml-2">({selectedSize}")</span>
                    {product.hasFrameUpgrade && frameUpgrade && (
                      <div className="text-sm text-green-600 mt-1">
                        +{formatPrice(product.frameUpgradePrice || 0)} frame upgrade
                      </div>
                    )}
                  </div>

                  {/* Delivery Info */}
                  <p className="text-xs text-gray-500">Ships in {product.delivery}</p>
                </div>

                {/* Frame Upgrade Option for Canvas Stretched */}
                {product.hasFrameUpgrade && selectedProduct?.type === product.type && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={frameUpgrade}
                        onChange={(e) => {
                          setFrameUpgrade(e.target.checked);
                          setSelectedProduct({ type: product.type, size: selectedSize, frameUpgrade: e.target.checked });
                        }}
                        className="mr-3 w-4 h-4 text-mona-gold"
                      />
                      <div>
                        <span className="font-medium text-sm text-blue-700">
                          Add Professional Frame (+{formatPrice(product.frameUpgradePrice || 0)})
                        </span>
                        <p className="text-xs text-blue-600 mt-1">
                          Transform to gallery-ready framed canvas
                        </p>
                      </div>
                    </label>
                  </div>
                )}
                
                {/* Free Digital Copy Highlight */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
                  <div className="flex items-center justify-center text-green-700">
                    <Download size={16} className="mr-2" />
                    <span className="font-medium text-sm">Free digital copy included</span>
                  </div>
                  <p className="text-xs text-green-600 mt-1">
                    High-res file for printing additional copies
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Purchase Button */}
          {selectedProduct && (
            <div className="text-center">
              <button
                onClick={() => handlePurchase(selectedProduct.type, selectedProduct.size, selectedProduct.frameUpgrade)}
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
