// Simple, correct Stripe integration following best practices

// Stripe will be loaded from CDN
interface StripeWindow extends Window {
  Stripe?: any;
}

let stripeInstance: any = null;

// Load Stripe.js from CDN (the correct way)
function loadStripeScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Stripe can only be loaded in browser'));
      return;
    }

    // Check if Stripe is already loaded
    if ((window as StripeWindow).Stripe) {
      resolve();
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src="https://js.stripe.com/v3/"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Stripe.js')));
      return;
    }

    // Load Stripe.js from CDN
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    script.async = true;
    
    script.onload = () => {
      if ((window as StripeWindow).Stripe) {
        resolve();
      } else {
        reject(new Error('Stripe.js loaded but Stripe object not available'));
      }
    };
    
    script.onerror = () => {
      reject(new Error('Failed to load Stripe.js from CDN'));
    };

    document.head.appendChild(script);
  });
}

// Get Stripe instance (simple, correct approach)
export async function getStripe(): Promise<any> {
  if (stripeInstance) {
    return stripeInstance;
  }

  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!publishableKey) {
    throw new Error('Stripe publishable key not configured');
  }

  try {
    // Load Stripe.js from CDN first
    await loadStripeScript();
    
    // Initialize Stripe with publishable key
    const stripeWindow = window as StripeWindow;
    if (!stripeWindow.Stripe) {
      throw new Error('Stripe not available on window object');
    }
    stripeInstance = stripeWindow.Stripe(publishableKey);
    
    if (!stripeInstance) {
      throw new Error('Failed to initialize Stripe');
    }

    console.log('✅ Stripe loaded successfully from CDN');
    return stripeInstance;
    
  } catch (error) {
    console.error('❌ Failed to load Stripe:', error);
    throw error;
  }
}

// Simple redirect to checkout
export async function redirectToCheckout(sessionId: string): Promise<{ error?: any }> {
  try {
    console.log('💳 Redirecting to Stripe checkout...');
    
    const stripe = await getStripe();
    const result = await stripe.redirectToCheckout({ sessionId });
    
    if (result.error) {
      console.error('Stripe redirect error:', result.error);
    }
    
    return result;
    
  } catch (error) {
    console.error('Checkout error:', error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Checkout failed',
        type: 'checkout_error'
      }
    };
  }
}
