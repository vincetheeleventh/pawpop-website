/**
 * Formats a price from cents to a readable string
 * @param amount - Price in cents
 * @param currency - Currency code (default: 'usd')
 * @returns Formatted price string (e.g., "$10.00")
 */
export function formatPrice(amount: number, currency: string = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(amount / 100);
}

/**
 * Validates a Stripe price ID
 * @param priceId - The price ID to validate
 * @returns boolean indicating if the price ID is valid
 */
export function isValidPriceId(priceId: string): boolean {
  return (
    typeof priceId === 'string' &&
    (priceId.startsWith('price_') || priceId.startsWith('plan_'))
  );
}

/**
 * Extracts error message from various error types
 * @param error - Error object or string
 * @returns A user-friendly error message
 */
export function getStripeErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null) {
    // Handle Stripe API errors
    if ('message' in error && typeof error.message === 'string') {
      return error.message;
    }
    if ('type' in error && typeof error.type === 'string') {
      return `Stripe error: ${error.type}`;
    }
  }
  return 'An unknown error occurred with the payment processor.';
}

/**
 * Creates a product object for use in the UI
 */
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  priceId: string;
  currency: string;
  features: string[];
}

/**
 * Sample product data - replace with your actual products
 */
export const sampleProducts: Product[] = [
  {
    id: 'basic',
    name: 'Basic Plan',
    description: 'Perfect for getting started',
    price: 999, // $9.99
    priceId: 'price_basic', // Replace with your actual price ID
    currency: 'usd',
    features: [
      'Feature 1',
      'Feature 2',
      'Feature 3',
    ],
  },
  {
    id: 'premium',
    name: 'Premium Plan',
    description: 'For power users who need more',
    price: 1999, // $19.99
    priceId: 'price_premium', // Replace with your actual price ID
    currency: 'usd',
    features: [
      'Everything in Basic',
      'Premium Feature 1',
      'Premium Feature 2',
      'Priority Support',
    ],
  },
];
