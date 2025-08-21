// src/components/landing/ProductSelection.tsx
"use client";

import { useEffect, useState } from "react";
import type { PaginatedBlueprints, Blueprint } from "@/lib/printify";
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
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || `Failed to fetch products: ${response.status} ${response.statusText}`
          );
        }
        const data: PaginatedBlueprints = await response.json();
        
        if (!data || !Array.isArray(data.data)) {
          throw new Error("Invalid data format received from server");
        }
        
        // Ensure each product has at least one image
        const productsWithImages = data.data.map(product => ({
          ...product,
          images: product.images && product.images.length > 0 
            ? product.images 
            : ['/images/placeholder.jpg']
        }));
        
        setProducts(productsWithImages);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return <div className="text-center p-10"><span className="loading loading-spinner loading-lg"></span></div>;
  }

  if (error) {
    return <div className="alert alert-error text-center p-10">Error: {error}</div>;
  }

  return (
    <section className="py-12 px-4">
      <h2 className="text-3xl font-bold text-center mb-8">Choose Your Product</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <p className="text-lg">No products available at the moment.</p>
          </div>
        ) : (
          products.map((product) => (
            <div key={product.id} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
              <figure>
                <img 
                  src={product.images[0]} 
                  alt={product.title} 
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/images/placeholder.jpg';
                  }}
                />
              </figure>
              <div className="card-body">
                <h3 className="card-title">{product.title}</h3>
                <p className="text-sm opacity-70">{product.brand}</p>
                <div className="card-actions justify-end">
                  <button 
                    onClick={handleCheckout}
                    disabled={isCheckingOut}
                    className={`btn btn-primary w-full ${isCheckingOut ? 'loading' : ''}`}
                  >
                    {isCheckingOut ? 'Processing...' : 'Buy Now'}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
};
