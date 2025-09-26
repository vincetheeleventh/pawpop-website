// src/lib/coupon-client.ts
'use client';

export interface CouponPreviewRequest {
  code: string;
  productType: string;
  size: string;
  frameUpgrade?: boolean;
  quantity?: number;
}

export interface CouponPreviewResponse {
  code: string;
  finalUnitPriceCents: number;
  originalUnitPriceCents: number;
  discountPerUnitCents: number;
  totalDiscountCents: number;
  quantity: number;
  description?: string;
  discountType?: string;
}

export async function previewCoupon(request: CouponPreviewRequest): Promise<CouponPreviewResponse> {
  const response = await fetch('/api/coupons/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      couponCode: request.code,
      productType: request.productType,
      size: request.size,
      frameUpgrade: request.frameUpgrade ?? false,
      quantity: request.quantity ?? 1
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Invalid coupon code.');
  }

  const data = await response.json();

  return {
    code: data.coupon?.code ?? request.code.trim().toUpperCase(),
    description: data.coupon?.description,
    discountType: data.coupon?.discountType,
    finalUnitPriceCents: data.finalUnitPriceCents,
    originalUnitPriceCents: data.originalUnitPriceCents,
    discountPerUnitCents: data.discountPerUnitCents,
    totalDiscountCents: data.totalDiscountCents,
    quantity: data.quantity ?? request.quantity ?? 1
  };
}
