import { CouponValidationRequest, CouponValidationResponse } from '@/app/api/coupons/validate/route';

export interface CouponState {
  code: string;
  isValid: boolean;
  isValidating: boolean;
  discountAmount: number;
  finalAmount: number;
  errorMessage?: string;
  savings?: number;
  discountType?: 'percentage' | 'fixed_amount';
  discountValue?: number;
}

export const initialCouponState: CouponState = {
  code: '',
  isValid: false,
  isValidating: false,
  discountAmount: 0,
  finalAmount: 0,
  errorMessage: undefined,
  savings: undefined
};

/**
 * Validate a coupon code against the API
 */
export async function validateCouponCode(
  code: string,
  orderAmount: number,
  productType?: string
): Promise<CouponValidationResponse> {
  try {
    const request: CouponValidationRequest = {
      code: code.trim().toUpperCase(),
      orderAmount,
      productType
    };

    const response = await fetch('/api/coupons/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to validate coupon');
    }

    return await response.json();
  } catch (error) {
    console.error('Error validating coupon:', error);
    return {
      isValid: false,
      errorMessage: error instanceof Error ? error.message : 'Failed to validate coupon'
    };
  }
}

/**
 * Calculate pricing with coupon applied
 */
export function calculateCouponPricing(
  originalAmount: number,
  couponData: CouponValidationResponse
): {
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  savings: number;
  discountPercentage: number;
} {
  if (!couponData.isValid || !couponData.discountAmount) {
    return {
      originalAmount,
      discountAmount: 0,
      finalAmount: originalAmount,
      savings: 0,
      discountPercentage: 0
    };
  }

  const discountAmount = couponData.discountAmount;
  const finalAmount = couponData.finalAmount || (originalAmount - discountAmount);
  const savings = originalAmount - finalAmount;
  const discountPercentage = Math.round((savings / originalAmount) * 100);

  return {
    originalAmount,
    discountAmount,
    finalAmount,
    savings,
    discountPercentage
  };
}

/**
 * Format discount display text
 */
export function formatDiscountText(couponData: CouponValidationResponse): string {
  if (!couponData.isValid || !couponData.discountType || !couponData.discountValue) {
    return '';
  }

  if (couponData.discountType === 'percentage') {
    return `${couponData.discountValue}% off`;
  } else {
    return `$${couponData.discountValue.toFixed(2)} off`;
  }
}

/**
 * Format savings display text
 */
export function formatSavingsText(savings: number): string {
  return `You save $${savings.toFixed(2)}!`;
}

/**
 * Check if coupon code looks valid (basic format validation)
 */
export function isValidCouponFormat(code: string): boolean {
  const trimmed = code.trim();
  return trimmed.length >= 3 && trimmed.length <= 50 && /^[A-Z0-9]+$/.test(trimmed.toUpperCase());
}

/**
 * Test coupon codes for development/testing
 */
export const TEST_COUPONS = {
  TEST99: {
    code: 'TEST99',
    description: '99% off for testing ($1 final price)',
    discountType: 'percentage' as const,
    discountValue: 99
  },
  DOLLAR1: {
    code: 'DOLLAR1',
    description: 'Fixed $1 price for testing',
    discountType: 'fixed_amount' as const,
    discountValue: 28 // Assumes $29 base price
  },
  SAVE44: {
    code: 'SAVE44',
    description: '$44 off for testing',
    discountType: 'fixed_amount' as const,
    discountValue: 44
  },
  WELCOME10: {
    code: 'WELCOME10',
    description: '10% off for new customers',
    discountType: 'percentage' as const,
    discountValue: 10
  }
} as const;

/**
 * Get test coupon for $1 pricing (useful for Stripe testing)
 */
export function getTestCouponFor1Dollar(): string {
  return TEST_COUPONS.TEST99.code;
}

/**
 * Debounced coupon validation hook helper
 */
export function createCouponValidator(
  orderAmount: number,
  productType?: string,
  debounceMs: number = 500
) {
  let timeoutId: NodeJS.Timeout;
  
  return (code: string): Promise<CouponValidationResponse> => {
    return new Promise((resolve) => {
      clearTimeout(timeoutId);
      
      if (!code.trim()) {
        resolve({
          isValid: false,
          errorMessage: undefined
        });
        return;
      }

      if (!isValidCouponFormat(code)) {
        resolve({
          isValid: false,
          errorMessage: 'Invalid coupon format'
        });
        return;
      }

      timeoutId = setTimeout(async () => {
        const result = await validateCouponCode(code, orderAmount, productType);
        resolve(result);
      }, debounceMs);
    });
  };
}
