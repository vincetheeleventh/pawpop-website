'use client';

import { useState } from 'react';
import Image from 'next/image';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface Pop5PackCheckoutProps {
  artworkId: string;
  proofImageUrl: string;
  parodyStyle: string;
  customerEmail: string;
}

const parodyStyleNames: Record<string, string> = {
  wizard: 'Wizard',
  paws: 'PAWS',
  popstar: 'Popstar',
  dogfather: 'Dogfather',
};

const parodyStyleIcons: Record<string, string> = {
  wizard: '🪄',
  paws: '🦈',
  popstar: '🎤',
  dogfather: '🎩',
};

export default function Pop5PackCheckout({
  artworkId,
  proofImageUrl,
  parodyStyle,
  customerEmail,
}: Pop5PackCheckoutProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const styleName = parodyStyleNames[parodyStyle] || parodyStyle;
  const styleIcon = parodyStyleIcons[parodyStyle] || '🎨';

  const handleCheckout = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Create Stripe checkout session
      const response = await fetch('/api/pop5pack/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          artworkId,
          customerEmail,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-site-bg py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-arvo text-4xl md:text-5xl font-bold text-text-primary mb-4">
            Get All 4 Parody Styles
          </h1>
          <p className="font-geist text-xl text-text-primary/70">
            High-resolution, watermark-free digital downloads
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left: Proof Preview */}
          <div className="bg-card-surface rounded-2xl p-6 shadow-lg">
            <h2 className="font-arvo text-2xl font-bold text-text-primary mb-4">
              Your Free Proof
            </h2>
            
            <div className="relative aspect-square rounded-xl overflow-hidden border-4 border-naples-yellow mb-4">
              {proofImageUrl ? (
                <Image
                  src={proofImageUrl}
                  alt={`${styleName} Proof`}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <span className="text-6xl">{styleIcon}</span>
                </div>
              )}
            </div>

            <div className="bg-naples-yellow/20 border-l-4 border-naples-yellow p-4 rounded-lg">
              <p className="font-geist text-sm text-text-primary">
                <strong>Note:</strong> This is a low-resolution watermarked proof. 
                The full pack includes high-resolution, watermark-free versions!
              </p>
            </div>
          </div>

          {/* Right: Checkout */}
          <div className="bg-card-surface rounded-2xl p-6 shadow-lg">
            <h2 className="font-arvo text-2xl font-bold text-text-primary mb-6">
              What You'll Get
            </h2>

            {/* All 4 Styles */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 p-3 bg-site-bg rounded-lg">
                <span className="text-3xl">🪄</span>
                <div>
                  <p className="font-geist font-semibold text-text-primary">Wizarding World</p>
                  <p className="font-geist text-sm text-text-primary/60">Magical wizard portrait</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-site-bg rounded-lg">
                <span className="text-3xl">🦈</span>
                <div>
                  <p className="font-geist font-semibold text-text-primary">Jaws</p>
                  <p className="font-geist text-sm text-text-primary/60">Iconic movie poster style</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-site-bg rounded-lg">
                <span className="text-3xl">🎩</span>
                <div>
                  <p className="font-geist font-semibold text-text-primary">The Godfather</p>
                  <p className="font-geist text-sm text-text-primary/60">Mafia boss portrait</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-site-bg rounded-lg">
                <span className="text-3xl">🎤</span>
                <div>
                  <p className="font-geist font-semibold text-text-primary">MJ Thriller</p>
                  <p className="font-geist text-sm text-text-primary/60">80s album cover pose</p>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="bg-gradient-to-r from-pale-azure/10 to-cyclamen/10 rounded-xl p-4 mb-6">
              <ul className="space-y-2 font-geist text-sm text-text-primary">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>High-resolution (2048x2048px)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>No watermarks</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Instant digital delivery</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Perfect for social media & printing</span>
                </li>
              </ul>
            </div>

            {/* Price */}
            <div className="bg-gradient-to-r from-pale-azure to-cyclamen rounded-xl p-6 mb-6 text-center">
              <p className="font-geist text-white/90 text-sm mb-2">Complete Pack</p>
              <p className="font-arvo text-5xl font-bold text-white mb-2">$5</p>
              <p className="font-geist text-white/80 text-sm">One-time payment</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="font-geist text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Checkout Button */}
            <button
              onClick={handleCheckout}
              disabled={isLoading}
              className="w-full bg-atomic-tangerine hover:bg-atomic-tangerine/90 text-white font-fredoka text-xl py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {isLoading ? 'Processing...' : 'Get All 4 Styles Now'}
            </button>

            {/* Guarantee */}
            <div className="mt-6 text-center">
              <p className="font-geist text-sm text-text-primary/60">
                💯 <strong>100% Satisfaction Guarantee</strong>
              </p>
              <p className="font-geist text-xs text-text-primary/50 mt-1">
                Love it or get your money back
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-12 bg-card-surface rounded-2xl p-8 shadow-lg">
          <h2 className="font-arvo text-2xl font-bold text-text-primary mb-6 text-center">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4 max-w-2xl mx-auto">
            <div>
              <h3 className="font-geist font-semibold text-text-primary mb-2">
                How long does it take to get my images?
              </h3>
              <p className="font-geist text-sm text-text-primary/70">
                Instant! After payment, we'll generate all 4 high-resolution styles and email you download links within 5-10 minutes.
              </p>
            </div>

            <div>
              <h3 className="font-geist font-semibold text-text-primary mb-2">
                What resolution are the final images?
              </h3>
              <p className="font-geist text-sm text-text-primary/70">
                All images are 2048x2048 pixels, perfect for social media posts, printing, or digital use.
              </p>
            </div>

            <div>
              <h3 className="font-geist font-semibold text-text-primary mb-2">
                Can I use these images commercially?
              </h3>
              <p className="font-geist text-sm text-text-primary/70">
                Yes! You have full rights to use your images for personal or commercial purposes.
              </p>
            </div>

            <div>
              <h3 className="font-geist font-semibold text-text-primary mb-2">
                What if I'm not satisfied?
              </h3>
              <p className="font-geist text-sm text-text-primary/70">
                We offer a 100% money-back guarantee. If you're not happy with your images, email us within 7 days for a full refund.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
