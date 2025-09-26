// Temporary debug endpoint to check production environment variables

import { NextResponse } from 'next/server';

export async function GET() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_API_KEY;
  const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  return NextResponse.json({
    environment: 'production',
    timestamp: new Date().toISOString(),
    keys: {
      hasStripeSecret: !!stripeSecretKey,
      hasStripePublishable: !!stripePublishableKey,
      hasWebhookSecret: !!webhookSecret,
      secretKeyPrefix: stripeSecretKey?.substring(0, 12) || 'missing',
      publishableKeyPrefix: stripePublishableKey?.substring(0, 12) || 'missing',
      webhookSecretPrefix: webhookSecret?.substring(0, 12) || 'missing',
      secretKeyType: stripeSecretKey ? (stripeSecretKey.startsWith('sk_live_') ? 'LIVE' : 'TEST') : 'MISSING',
      publishableKeyType: stripePublishableKey ? (stripePublishableKey.startsWith('pk_live_') ? 'LIVE' : 'TEST') : 'MISSING',
      keysMatch: stripeSecretKey && stripePublishableKey ? 
        (stripeSecretKey.startsWith('sk_live_') === stripePublishableKey.startsWith('pk_live_')) : false
    }
  });
}
