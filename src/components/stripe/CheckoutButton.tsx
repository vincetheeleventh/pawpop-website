'use client';

import { useState, useEffect } from 'react';
import { redirectToCheckout } from '@/lib/stripe-simple';

// Using enhanced Stripe integration with ad-blocker fallback
interface CheckoutButtonProps {
  priceId: string;
  itemName: string;
  amount: number;
  currency?: string;
  quantity?: number;
  className?: string;
  onError?: (error: Error) => void;
}

export default function CheckoutButton({
  priceId,
  itemName,
  amount,
  currency = 'usd',
  quantity = 1,
  className = '',
  onError,
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('Initiating checkout with priceId:', priceId, 'quantity:', quantity);
      
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          quantity,
        }),
      });

      console.log('Checkout API response status:', response.status);
      
      let data;
      try {
        data = await response.json();
        console.log('Checkout API response data:', data);
      } catch (e) {
        console.error('Failed to parse JSON response:', e);
        throw new Error('Invalid response from server. Please try again.');
      }

      if (!response.ok) {
        const errorMessage = data?.error || data?.message || `HTTP error! status: ${response.status}`;
        console.error('Checkout API error:', errorMessage);
        throw new Error(errorMessage);
      }

      if (!data.sessionId) {
        console.error('No sessionId in response:', data);
        throw new Error('Invalid response from server: missing sessionId');
      }
      
      console.log('Initializing Stripe redirect with session ID:', data.sessionId);
      
      const { error: stripeError } = await redirectToCheckout(data.sessionId);

      if (stripeError) {
        console.error('Stripe redirect error:', stripeError);
        throw new Error(stripeError.message || 'Checkout failed');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred during checkout');
      console.error('Checkout error:', error);
      setError(error.message);
      setLoading(false);
      if (onError) {
        onError(error);
      }
    }
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <button
        onClick={handleCheckout}
        disabled={loading}
        className={`px-6 py-3 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors ${
          loading ? 'opacity-70 cursor-not-allowed' : ''
        }`}
      >
        {loading ? 'Processing...' : `Pay $${(amount / 100).toFixed(2)}`}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
