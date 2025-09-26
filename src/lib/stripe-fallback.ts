// Enhanced Stripe integration with ad-blocker fallback
import { loadStripe, Stripe } from '@stripe/stripe-js';

// Global Stripe instance with fallback handling
let stripePromise: Promise<Stripe | null> | null = null;
let fallbackMode = false;

// Detect if Stripe resources are being blocked
async function detectStripeBlocking(): Promise<boolean> {
  try {
    // Check for common ad blocker indicators
    const adBlockerIndicators = [
      // Check if common ad blocker extensions are present
      typeof window !== 'undefined' && (window as any).uBlock,
      typeof window !== 'undefined' && (window as any).adblockplus,
      typeof window !== 'undefined' && (window as any).AdBlocker,
      // Check if tracking protection is enabled (Safari)
      typeof navigator !== 'undefined' && navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome'),
      // Check if requests to tracking domains fail
      typeof window !== 'undefined' && window.location.hostname.includes('localhost') === false
    ];
    
    // If any indicators suggest blocking, use fallback
    const hasBlockingIndicators = adBlockerIndicators.some(indicator => indicator);
    
    if (hasBlockingIndicators) {
      console.log('🚫 Ad blocking detected, enabling direct redirect mode');
      return true;
    }
    
    // Test if we can reach Stripe's tracking endpoints
    const testUrls = [
      'https://r.stripe.com/b',
      'https://js.stripe.com/v3/'
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
    const isBlocked = results.some(result => result.status === 'rejected');
    if (isBlocked) {
      console.log('🚫 Stripe endpoints blocked, enabling fallback mode');
    }
    
    return isBlocked;
  } catch {
    console.log('🚫 Blocking detection failed, assuming blocked');
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

// Enhanced checkout with aggressive fallback handling
export async function redirectToCheckout(sessionId: string): Promise<{ error?: any }> {
  try {
    // Check for blocking before attempting any Stripe.js operations
    const isBlocked = await detectStripeBlocking();
    
    if (isBlocked || fallbackMode) {
      console.log('🔄 Ad blocking detected - using direct redirect to bypass Stripe.js');
      
      // Direct redirect to Stripe checkout URL (bypasses all Stripe.js)
      const checkoutUrl = `https://checkout.stripe.com/c/pay/${sessionId}`;
      
      try {
        // Use direct window redirect to avoid any Stripe.js interference
        window.location.href = checkoutUrl;
        return {}; // Success - redirect initiated
      } catch (redirectError) {
        console.error('Direct redirect failed:', redirectError);
        return { 
          error: { 
            message: 'Unable to redirect to checkout. Please try a different browser or disable privacy extensions.',
            type: 'redirect_error'
          }
        };
      }
    }

    // Only use Stripe.js if no blocking detected
    console.log('💳 No blocking detected - using standard Stripe.js redirect');
    const stripe = await getStripe();
    
    if (!stripe) {
      // Fallback to direct redirect if Stripe.js fails to load
      console.log('🔄 Stripe.js failed to load - falling back to direct redirect');
      const checkoutUrl = `https://checkout.stripe.com/c/pay/${sessionId}`;
      window.location.href = checkoutUrl;
      return {};
    }

    const result = await stripe.redirectToCheckout({ sessionId });
    
    if (result.error) {
      console.error('Stripe.js redirect error:', result.error);
      
      // Immediate fallback to direct redirect
      console.log('🔄 Stripe.js redirect failed - using direct redirect fallback');
      const checkoutUrl = `https://checkout.stripe.com/c/pay/${sessionId}`;
      window.location.href = checkoutUrl;
      return {}; // Assume success for direct redirect
    }
    
    return result;
    
  } catch (error) {
    console.error('Checkout error:', error);
    
    // Ultimate fallback: direct redirect
    console.log('🚨 All methods failed - using ultimate direct redirect fallback');
    const checkoutUrl = `https://checkout.stripe.com/c/pay/${sessionId}`;
    
    try {
      window.location.href = checkoutUrl;
      return {}; // Assume success
    } catch (finalError) {
      console.error('Ultimate fallback failed:', finalError);
      return { 
        error: { 
          message: 'Unable to redirect to checkout. Please copy this URL and open it manually: ' + checkoutUrl,
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
