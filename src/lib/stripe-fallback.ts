// Enhanced Stripe integration with ad-blocker fallback
import { loadStripe, Stripe } from '@stripe/stripe-js';

// Global Stripe instance with fallback handling
let stripePromise: Promise<Stripe | null> | null = null;
let fallbackMode = false;

// Detect if Stripe resources are being blocked
async function detectStripeBlocking(): Promise<boolean> {
  try {
    // Test if we can reach Stripe's API endpoints
    const testUrls = [
      'https://js.stripe.com/v3/',
      'https://r.stripe.com/b'
    ];
    
    const results = await Promise.allSettled(
      testUrls.map(url => 
        fetch(url, { 
          method: 'HEAD', 
          mode: 'no-cors',
          cache: 'no-cache'
        }).catch(() => Promise.reject('blocked'))
      )
    );
    
    // If any requests fail, assume blocking
    return results.some(result => result.status === 'rejected');
  } catch {
    return true; // Assume blocking if detection fails
  }
}

// Enhanced getStripe with blocking detection
export async function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) {
      console.error('Stripe publishable key not configured');
      return null;
    }

    // Check for blocking before loading Stripe
    const isBlocked = await detectStripeBlocking();
    if (isBlocked) {
      console.warn('🚫 Stripe resources appear to be blocked. Enabling fallback mode.');
      fallbackMode = true;
    }

    stripePromise = loadStripe(publishableKey, {
      // Add options that might help with ad blockers
      stripeAccount: undefined,
      apiVersion: undefined, // Use account default
    });
  }
  
  return stripePromise;
}

// Enhanced checkout with fallback handling
export async function redirectToCheckout(sessionId: string): Promise<{ error?: any }> {
  try {
    const stripe = await getStripe();
    
    if (!stripe) {
      throw new Error('Failed to load Stripe');
    }

    // If in fallback mode, try direct redirect first
    if (fallbackMode) {
      console.log('🔄 Using fallback checkout method');
      
      // Direct redirect to Stripe checkout URL
      const checkoutUrl = `https://checkout.stripe.com/c/pay/${sessionId}`;
      
      // Try to open in same window first
      try {
        window.location.href = checkoutUrl;
        return {}; // Success
      } catch (redirectError) {
        console.warn('Direct redirect failed, trying Stripe.js method');
      }
    }

    // Standard Stripe.js redirect
    console.log('💳 Using standard Stripe.js redirect');
    const result = await stripe.redirectToCheckout({ sessionId });
    
    if (result.error) {
      console.error('Stripe redirect error:', result.error);
      
      // If Stripe.js fails, try direct redirect as fallback
      if (!fallbackMode) {
        console.log('🔄 Stripe.js failed, trying direct redirect fallback');
        const checkoutUrl = `https://checkout.stripe.com/c/pay/${sessionId}`;
        window.location.href = checkoutUrl;
        return {}; // Assume success for direct redirect
      }
    }
    
    return result;
    
  } catch (error) {
    console.error('Checkout error:', error);
    
    // Ultimate fallback: direct redirect
    console.log('🚨 All methods failed, using direct URL redirect');
    const checkoutUrl = `https://checkout.stripe.com/c/pay/${sessionId}`;
    
    try {
      window.location.href = checkoutUrl;
      return {}; // Assume success
    } catch (finalError) {
      return { 
        error: { 
          message: 'Unable to redirect to checkout. Please try disabling ad blockers or try a different browser.',
          type: 'redirect_error'
        }
      };
    }
  }
}

// Check if we're in fallback mode
export function isFallbackMode(): boolean {
  return fallbackMode;
}

// Reset Stripe instance (for testing)
export function resetStripe(): void {
  stripePromise = null;
  fallbackMode = false;
}
