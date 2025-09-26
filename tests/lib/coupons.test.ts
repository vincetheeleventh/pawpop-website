import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  validateCouponCode,
  calculateCouponPricing,
  formatDiscountText,
  formatSavingsText,
  isValidCouponFormat,
  initialCouponState,
  TEST_COUPONS,
  getTestCouponFor1Dollar
} from '@/lib/coupons';

// Mock fetch
global.fetch = vi.fn();

describe('Coupon Library', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateCouponCode', () => {
    it('should validate a valid coupon code', async () => {
      const mockResponse = {
        isValid: true,
        couponId: 'coupon-123',
        discountType: 'percentage' as const,
        discountValue: 99,
        discountAmount: 28.71,
        finalAmount: 1.00,
        savings: 28.71
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await validateCouponCode('TEST99', 29.00, 'art_print');

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith('/api/coupons/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: 'TEST99',
          orderAmount: 29.00,
          productType: 'art_print'
        })
      });
    });

    it('should handle invalid coupon code', async () => {
      const mockResponse = {
        isValid: false,
        errorMessage: 'Invalid coupon code'
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await validateCouponCode('INVALID', 29.00);

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Invalid coupon code');
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      const result = await validateCouponCode('TEST99', 29.00);

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Network error');
    });

    it('should handle API errors', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Server error' })
      });

      const result = await validateCouponCode('TEST99', 29.00);

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Server error');
    });

    it('should trim and uppercase coupon codes', async () => {
      const mockResponse = {
        isValid: true,
        couponId: 'coupon-123',
        discountAmount: 2.90,
        finalAmount: 26.10
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      await validateCouponCode('  test99  ', 29.00);

      expect(global.fetch).toHaveBeenCalledWith('/api/coupons/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: 'TEST99',
          orderAmount: 29.00,
          productType: undefined
        })
      });
    });
  });

  describe('calculateCouponPricing', () => {
    it('should calculate pricing with valid coupon', () => {
      const originalAmount = 29.00;
      const couponData = {
        isValid: true,
        discountAmount: 28.71,
        finalAmount: 1.00
      };

      const result = calculateCouponPricing(originalAmount, couponData);

      expect(result).toEqual({
        originalAmount: 29.00,
        discountAmount: 28.71,
        finalAmount: 1.00,
        savings: 28.00,
        discountPercentage: 97
      });
    });

    it('should handle invalid coupon', () => {
      const originalAmount = 29.00;
      const couponData = {
        isValid: false
      };

      const result = calculateCouponPricing(originalAmount, couponData);

      expect(result).toEqual({
        originalAmount: 29.00,
        discountAmount: 0,
        finalAmount: 29.00,
        savings: 0,
        discountPercentage: 0
      });
    });

    it('should handle missing discount amount', () => {
      const originalAmount = 29.00;
      const couponData = {
        isValid: true,
        discountAmount: undefined,
        finalAmount: undefined
      };

      const result = calculateCouponPricing(originalAmount, couponData);

      expect(result).toEqual({
        originalAmount: 29.00,
        discountAmount: 0,
        finalAmount: 29.00,
        savings: 0,
        discountPercentage: 0
      });
    });

    it('should calculate percentage correctly', () => {
      const originalAmount = 100.00;
      const couponData = {
        isValid: true,
        discountAmount: 25.00,
        finalAmount: 75.00
      };

      const result = calculateCouponPricing(originalAmount, couponData);

      expect(result.discountPercentage).toBe(25);
    });
  });

  describe('formatDiscountText', () => {
    it('should format percentage discount', () => {
      const couponData = {
        isValid: true,
        discountType: 'percentage' as const,
        discountValue: 99
      };

      const result = formatDiscountText(couponData);
      expect(result).toBe('99% off');
    });

    it('should format fixed amount discount', () => {
      const couponData = {
        isValid: true,
        discountType: 'fixed_amount' as const,
        discountValue: 28.00
      };

      const result = formatDiscountText(couponData);
      expect(result).toBe('$28.00 off');
    });

    it('should handle invalid coupon', () => {
      const couponData = {
        isValid: false
      };

      const result = formatDiscountText(couponData);
      expect(result).toBe('');
    });

    it('should handle missing data', () => {
      const couponData = {
        isValid: true,
        discountType: undefined,
        discountValue: undefined
      };

      const result = formatDiscountText(couponData);
      expect(result).toBe('');
    });
  });

  describe('formatSavingsText', () => {
    it('should format savings amount', () => {
      const result = formatSavingsText(28.71);
      expect(result).toBe('You save $28.71!');
    });

    it('should format with two decimal places', () => {
      const result = formatSavingsText(5);
      expect(result).toBe('You save $5.00!');
    });

    it('should handle zero savings', () => {
      const result = formatSavingsText(0);
      expect(result).toBe('You save $0.00!');
    });
  });

  describe('isValidCouponFormat', () => {
    it('should validate correct format', () => {
      expect(isValidCouponFormat('TEST99')).toBe(true);
      expect(isValidCouponFormat('WELCOME10')).toBe(true);
      expect(isValidCouponFormat('SAVE5')).toBe(true);
      expect(isValidCouponFormat('ABC123XYZ')).toBe(true);
    });

    it('should reject invalid formats', () => {
      expect(isValidCouponFormat('')).toBe(false);
      expect(isValidCouponFormat('  ')).toBe(false);
      expect(isValidCouponFormat('AB')).toBe(false); // Too short
      expect(isValidCouponFormat('A'.repeat(51))).toBe(false); // Too long
      expect(isValidCouponFormat('test-99')).toBe(false); // Contains hyphen
      expect(isValidCouponFormat('test 99')).toBe(false); // Contains space
      expect(isValidCouponFormat('test@99')).toBe(false); // Contains special char
    });

    it('should handle case insensitive validation', () => {
      expect(isValidCouponFormat('test99')).toBe(true);
      expect(isValidCouponFormat('Test99')).toBe(true);
      expect(isValidCouponFormat('TEST99')).toBe(true);
    });

    it('should trim whitespace', () => {
      expect(isValidCouponFormat('  TEST99  ')).toBe(true);
      expect(isValidCouponFormat('\tTEST99\n')).toBe(true);
    });
  });

  describe('initialCouponState', () => {
    it('should have correct initial state', () => {
      expect(initialCouponState).toEqual({
        code: '',
        isValid: false,
        isValidating: false,
        discountAmount: 0,
        finalAmount: 0,
        errorMessage: undefined,
        savings: undefined
      });
    });
  });

  describe('TEST_COUPONS', () => {
    it('should have test coupon definitions', () => {
      expect(TEST_COUPONS.TEST99).toEqual({
        code: 'TEST99',
        description: '99% off for testing ($1 final price)',
        discountType: 'percentage',
        discountValue: 99
      });

      expect(TEST_COUPONS.DOLLAR1).toEqual({
        code: 'DOLLAR1',
        description: 'Fixed $1 price for testing',
        discountType: 'fixed_amount',
        discountValue: 28
      });

      expect(TEST_COUPONS.SAVE44).toEqual({
        code: 'SAVE44',
        description: '$44 off for testing',
        discountType: 'fixed_amount',
        discountValue: 44
      });

      expect(TEST_COUPONS.WELCOME10).toEqual({
        code: 'WELCOME10',
        description: '10% off for new customers',
        discountType: 'percentage',
        discountValue: 10
      });
    });
  });

  describe('getTestCouponFor1Dollar', () => {
    it('should return TEST99 coupon code', () => {
      const result = getTestCouponFor1Dollar();
      expect(result).toBe('TEST99');
    });
  });
});
