// src/components/modals/PurchaseModalDigitalFirst.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Download, Star, Truck } from 'lucide-react';
import { Artwork } from '@/lib/supabase';
import { createCheckoutSession } from '@/lib/stripe-client';
import { ProductType, getProductPricing } from '@/lib/printify-products';
import { loadStripe } from '@stripe/stripe-js';
import { useCoupon } from '@/hooks/useCoupon';

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY 
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

interface PurchaseModalDigitalFirstProps {
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

export const PurchaseModalDigitalFirst = ({ isOpen, onClose, artwork }: PurchaseModalDigitalFirstProps) => {
  const [showPhysical, setShowPhysical] = useState(false);
  const [selectedPhysical, setSelectedPhysical] = useState<{ type: ProductType; size: string } | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const {
    couponCode,
    setCouponCode,
    appliedCoupon,
    couponError,
    setCouponError,
    isApplying: isApplyingCoupon,
    applyCoupon,
    resetCoupon
  } = useCoupon();
  const [couponSuccessMessage, setCouponSuccessMessage] = useState<string | null>(null);
  const artworkImageUrl = artwork.generated_images?.artwork_preview ||
    artwork.generated_images?.artwork_full_res ||
    (artwork as any).generated_image_url || '';

  useEffect(() => {
    resetCoupon();
    setCouponSuccessMessage(null);
  }, [resetCoupon, showPhysical, selectedPhysical?.type, selectedPhysical?.size]);

  if (!isOpen) return null;

  const handlePurchase = async (productType: ProductType, size: string) => {
    setIsCheckingOut(true);

    // Demo mode - just show alert instead of real checkout
    if (!stripePromise) {
      setTimeout(() => {
        alert(`Demo: Would purchase ${productType} (${size}) for ${artwork.customer_name}\nVariant: Digital-First`);
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
          imageUrl: artworkImageUrl,
          variant: 'digital-first', // For A/B testing analytics
          couponCode: appliedCoupon?.code || couponCode.trim() || undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Checkout failed');
      }

      const { sessionId } = await response.json();
      const stripe = await stripePromise;
      
      if (!stripe) throw new Error('Stripe failed to load');

      await stripe.redirectToCheckout({ sessionId });
    } catch (error) {
      console.error('Checkout error:', error);
      if (error instanceof Error && error.message.includes('Coupon')) {
        setCouponError(error.message);
      }
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleApplyCoupon = async () => {
    const context = showPhysical
      ? selectedPhysical
        ? { productType: selectedPhysical.type, size: selectedPhysical.size, quantity: 1 }
        : null
      : { productType: ProductType.DIGITAL, size: 'digital', quantity: 1 };

    if (!context) {
      setCouponError('Select a product option before applying the coupon.');
      setCouponSuccessMessage(null);
      return;
    }

    const result = await applyCoupon(context);
    if (result) {
      const finalPrice = (result.finalUnitPriceCents / 100).toFixed(2);
      const savings = result.totalDiscountCents > 0 ? (result.totalDiscountCents / 100).toFixed(2) : null;
      setCouponSuccessMessage(
        savings
          ? `Coupon applied! Checkout price: $${finalPrice} (saved $${savings}).`
          : `Coupon applied! Checkout price: $${finalPrice}.`
      );
    } else {
      setCouponSuccessMessage(null);
    }
  };

  const handleCouponInputChange = (value: string) => {
    setCouponCode(value.toUpperCase());
    resetCoupon();
    setCouponSuccessMessage(null);
    setCouponError(null);
  };

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-playfair font-bold text-charcoal-frame">
            Get Your Masterpiece
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {/* Artwork Preview */}
          <div className="flex items-center mb-8">
            <Image 
              src={artwork.generated_images?.artwork_preview || artwork.generated_images?.artwork_full_res || '/images/placeholder.jpg'}
              alt="Your masterpiece"
              width={80}
              height={80}
              quality={85}
              sizes="80px"
              className="w-20 h-20 rounded-lg object-cover mr-4"
            />
            <div>
              <h3 className="font-semibold text-charcoal-frame">
                {artwork.customer_name}{artwork.pet_name ? ` & ${artwork.pet_name}` : ''} Masterpiece
              </h3>
              <p className="text-sm text-gray-600">In the style of the Mona Lisa</p>
            </div>
          </div>

          {!showPhysical ? (
            // Digital-First View
            <div className="space-y-6">
              {/* Main Digital CTA */}
              <div className="bg-gradient-to-r from-mona-gold/10 to-mona-gold/5 border-2 border-mona-gold rounded-lg p-6 text-center">
                <Download className="w-12 h-12 text-mona-gold mx-auto mb-4" />
                <h3 className="text-xl font-playfair font-bold text-charcoal-frame mb-2">
                  Instant Download, Print it Yourself
                </h3>
                <p className="text-gray-600 mb-4">
                  High-resolution digital file (4000x4000px) ready for printing at any size
                </p>
                <div className="text-3xl font-bold text-mona-gold mb-4">
                  {formatPrice(getProductPricing(ProductType.DIGITAL, 'digital', 'US'))}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600" htmlFor="digital-coupon">Coupon Code</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      id="digital-coupon"
                      type="text"
                      value={couponCode}
                      onChange={(event) => handleCouponInputChange(event.target.value)}
                      className="input input-bordered flex-1 uppercase"
                      placeholder="ENTER CODE"
                      aria-label="Coupon code"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={isApplyingCoupon || (!couponCode.trim() && !appliedCoupon)}
                      className={`btn btn-outline ${isApplyingCoupon ? 'loading' : ''}`}
                      type="button"
                    >
                      {appliedCoupon ? 'Reapply' : 'Apply'}
                    </button>
                  </div>
                  {couponError && <p className="text-sm text-red-500">{couponError}</p>}
                  {couponSuccessMessage && !couponError && (
                    <p className="text-sm text-green-600" data-testid="coupon-success-message">
                      {couponSuccessMessage}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handlePurchase(ProductType.DIGITAL, 'digital')}
                  disabled={isCheckingOut}
                  className={`btn btn-primary btn-lg w-full ${isCheckingOut ? 'loading' : ''}`}
                >
                  {isCheckingOut ? 'Processing...' : 'Download Now'}
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  ✓ Instant delivery • ✓ Print unlimited copies • ✓ 30-day guarantee
                </p>
              </div>

              {/* Physical Options Teaser */}
              <div className="text-center">
                <p className="text-gray-600 mb-3">
                  Prefer a physical print delivered to your door?
                </p>
                <button
                  onClick={() => setShowPhysical(true)}
                  className="text-mona-gold hover:text-mona-gold/80 font-medium underline"
                >
                  <Truck className="w-4 h-4 inline mr-1" />
                  View Print Options
                </button>
              </div>
            </div>
          ) : (
            // Physical Options View
            <div className="space-y-4">
              <button
                onClick={() => setShowPhysical(false)}
                className="text-mona-gold hover:text-mona-gold/80 text-sm mb-4"
              >
                ← Back to Digital Download
              </button>

              <div className="grid gap-4">
                {/* Art Print */}
                <div
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedPhysical?.type === ProductType.ART_PRINT
                      ? 'border-mona-gold bg-mona-gold/5' 
                      : 'border-gray-200 hover:border-mona-gold/50'
                  }`}
                  onClick={() => setSelectedPhysical({ type: ProductType.ART_PRINT, size: '12x18' })}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold">Fine Art Print</h4>
                      <p className="text-sm text-gray-600">Museum-quality fine art paper (285 g/m²), ready to frame</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-mona-gold">From {formatPrice(getProductPricing(ProductType.ART_PRINT, '12x18', 'US'))}</div>
                      <div className="text-xs text-gray-500">Ships in 3-5 days</div>
                    </div>
                  </div>
                </div>

                {/* Framed Canvas */}
                <div 
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedPhysical?.type === ProductType.CANVAS_FRAMED 
                      ? 'border-mona-gold bg-mona-gold/5' 
                      : 'border-gray-200 hover:border-mona-gold/50'
                  }`}
                  onClick={() => setSelectedPhysical({ type: ProductType.CANVAS_FRAMED, size: '12x18' })}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold">Framed Canvas</h4>
                      <p className="text-sm text-gray-600">Gallery-wrapped with premium frame</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-mona-gold">From {formatPrice(getProductPricing(ProductType.CANVAS_FRAMED, '12x18', 'US'))}</div>
                      <div className="text-xs text-gray-500">Ships in 5-7 days</div>
                    </div>
                  </div>
                </div>
              </div>

              {selectedPhysical && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600" htmlFor="physical-coupon">Coupon Code</label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        id="physical-coupon"
                        type="text"
                        value={couponCode}
                        onChange={(event) => handleCouponInputChange(event.target.value)}
                        className="input input-bordered flex-1 uppercase"
                        placeholder="ENTER CODE"
                        aria-label="Coupon code"
                      />
                      <button
                        onClick={handleApplyCoupon}
                        disabled={isApplyingCoupon || (!couponCode.trim() && !appliedCoupon)}
                        className={`btn btn-outline ${isApplyingCoupon ? 'loading' : ''}`}
                        type="button"
                      >
                        {appliedCoupon ? 'Reapply' : 'Apply'}
                      </button>
                    </div>
                    {couponError && <p className="text-sm text-red-500">{couponError}</p>}
                    {couponSuccessMessage && !couponError && (
                      <p className="text-sm text-green-600" data-testid="coupon-success-message">
                        {couponSuccessMessage}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handlePurchase(selectedPhysical.type, selectedPhysical.size)}
                    disabled={isCheckingOut}
                    className={`btn btn-primary w-full mt-4 ${isCheckingOut ? 'loading' : ''}`}
                  >
                    {isCheckingOut ? 'Processing...' : 'Order Physical Print'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
