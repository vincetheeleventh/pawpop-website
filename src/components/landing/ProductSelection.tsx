// src/components/landing/ProductSelection.tsx
"use client";

import { useEffect, useState } from "react";
import type { PaginatedBlueprints, Blueprint } from "@/lib/types";
import { loadStripe } from '@stripe/stripe-js';

// Make sure to add your publishable key to your .env.local file
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

export const ProductSelection = () => {
  const [products, setProducts] = useState<Blueprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    try {
      // This is a placeholder. Replace with a real Stripe Price ID.
      const priceId = 'price_1Pj7QdRxH3u7a4fBqVjXyZk9'; 
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId, quantity: 1 }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { sessionId } = await response.json();
      const stripe = await stripePromise;

      if (!stripe) {
        throw new Error('Stripe.js failed to load.');
      }

      const { error } = await stripe.redirectToCheckout({ sessionId });

      if (error) {
        console.error('Stripe redirect error:', error);
        setError(error.message || 'An unknown Stripe error occurred.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred during checkout.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/products");
        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }
        const data: PaginatedBlueprints = await response.json();
        setProducts(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return <div className="text-center p-10">Loading products...</div>;
  }

  if (error) {
    return <div className="text-center p-10 text-red-500">Error: {error}</div>;
  }

  return (
    <section className="py-12 px-4">
      <h2 className="text-3xl font-bold text-center mb-8">Choose Your Product</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <div key={product.id} className="border rounded-lg p-4 text-center hover:shadow-lg transition-shadow">
            <img src={product.images[0]} alt={product.title} className="w-full h-48 object-cover mb-4 rounded" />
            <h3 className="font-semibold">{product.title}</h3>
            <p className="text-sm text-gray-500">{product.brand}</p>
            <button 
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className="mt-4 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {isCheckingOut ? 'Processing...' : 'Buy Now'}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};
