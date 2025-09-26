// src/hooks/useCoupon.ts
'use client';

import { useCallback, useState } from 'react';
import { previewCoupon, type CouponPreviewResponse } from '@/lib/coupon-client';

export interface CouponContext {
  productType: string;
  size: string;
  frameUpgrade?: boolean;
  quantity?: number;
}

export function useCoupon(initialCode = '') {
  const [couponCode, setCouponCode] = useState(initialCode);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponPreviewResponse | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const applyCoupon = useCallback(
    async (context: CouponContext): Promise<CouponPreviewResponse | null> => {
      const trimmedCode = couponCode.trim();
      if (!trimmedCode) {
        setCouponError('Enter a coupon code to apply it.');
        setAppliedCoupon(null);
        return null;
      }

      setIsApplying(true);
      setCouponError(null);

      try {
        const preview = await previewCoupon({
          code: trimmedCode,
          productType: context.productType,
          size: context.size,
          frameUpgrade: context.frameUpgrade ?? false,
          quantity: context.quantity ?? 1
        });
        setAppliedCoupon(preview);
        return preview;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Invalid coupon code.';
        setCouponError(message);
        setAppliedCoupon(null);
        return null;
      } finally {
        setIsApplying(false);
      }
    },
    [couponCode]
  );

  const resetCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setCouponError(null);
  }, []);

  return {
    couponCode,
    setCouponCode,
    appliedCoupon,
    couponError,
    setCouponError,
    isApplying,
    applyCoupon,
    resetCoupon
  };
}
