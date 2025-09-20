// src/lib/stripe-client.ts
'use client';

import { ProductType } from './printify-products';

export interface CheckoutSessionData {
  artworkId: string;
  productType: ProductType;
  customerName: string;
  customerEmail: string;
  size?: string;
}

/**
 * Creates a Stripe checkout session for artwork purchases
 * @param data - Checkout session data
 * @returns Promise with session URL or error
 */
export async function createCheckoutSession(data: CheckoutSessionData): Promise<{ url?: string; error?: string }> {
  try {
    const response = await fetch('/api/checkout/artwork', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      return { error: errorData.error || `HTTP ${response.status}` };
    }

    const result = await response.json();
    return { url: result.url };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return { error: 'Failed to create checkout session' };
  }
}

/**
 * Creates a test checkout session (for development/testing)
 * @returns Promise with session URL or error
 */
export async function createTestCheckoutSession(): Promise<{ url?: string; error?: string }> {
  try {
    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId: 'price_test', // Test price ID
        quantity: 1,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      return { error: errorData.error || `HTTP ${response.status}` };
    }

    const result = await response.json();
    return { url: result.url };
  } catch (error) {
    console.error('Error creating test checkout session:', error);
    return { error: 'Failed to create test checkout session' };
  }
}
