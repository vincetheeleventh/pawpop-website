// src/lib/stripe.ts
import Stripe from 'stripe';

if (!process.env.STRIPE_API_KEY) {
  throw new Error('Stripe API key is not configured.');
}

export const stripe = new Stripe(process.env.STRIPE_API_KEY, {
  apiVersion: '2025-07-30.basil',
  typescript: true,
});
