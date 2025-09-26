import { describe, it, expect, vi, afterEach } from 'vitest';
import type { CouponCode } from '@/lib/supabase';
import { normalizeCouponCode, calculateCouponAdjustment, getCouponIneligibilityReason } from '@/lib/supabase-coupons';

const baseCoupon: CouponCode = {
  id: 'coupon-123',
  code: 'TEST100',
  description: 'Test coupon',
  discount_type: 'set_price',
  discount_value: 100,
  max_redemptions: null,
  redemption_count: 0,
  valid_from: undefined,
  valid_until: undefined,
  is_active: true,
  metadata: {},
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('supabase-coupons helpers', () => {
  it('normalizes coupon codes to uppercase', () => {
    expect(normalizeCouponCode('test-code')).toBe('TEST-CODE');
  });

  it('calculates set price adjustments correctly', () => {
    const result = calculateCouponAdjustment(baseCoupon, 5000, 1);
    expect(result.finalUnitPriceCents).toBe(100);
    expect(result.discountPerUnitCents).toBe(4900);
    expect(result.totalDiscountCents).toBe(4900);
  });

  it('returns restriction message for expired coupons', () => {
    const expiredCoupon: CouponCode = {
      ...baseCoupon,
      valid_until: new Date(Date.now() - 86400000).toISOString()
    };
    expect(getCouponIneligibilityReason(expiredCoupon)).toContain('expired');
  });

  it('calculates amount off discounts per unit', () => {
    const amountOffCoupon: CouponCode = {
      ...baseCoupon,
      discount_type: 'amount_off',
      discount_value: 1500
    };
    const result = calculateCouponAdjustment(amountOffCoupon, 3000, 2);
    expect(result.finalUnitPriceCents).toBe(1500);
    expect(result.discountPerUnitCents).toBe(1500);
    expect(result.totalDiscountCents).toBe(3000);
  });
});
