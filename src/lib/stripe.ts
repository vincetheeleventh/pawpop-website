// src/lib/stripe.ts
import Stripe from 'stripe';

// Use STRIPE_SECRET_KEY as the standard environment variable name
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_API_KEY;

if (!stripeSecretKey) {
  console.warn('Stripe API key is not configured. Checkout functionality will be disabled.');
}

export const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  // Rely on your Stripe account's default API version to avoid type mismatches.
  typescript: true,
}) : null;
