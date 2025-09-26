// src/app/api/coupons/validate/route.ts
import { NextResponse } from 'next/server';
import { ProductType, getProductPricing } from '@/lib/printify-products';
import { normalizeCouponCode, validateCouponAndCalculate } from '@/lib/supabase-coupons';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      couponCode,
      productType,
      size,
      frameUpgrade = false,
      quantity = 1
    } = body;

    if (!couponCode || typeof couponCode !== 'string') {
      return NextResponse.json({ error: 'Coupon code is required.' }, { status: 400 });
    }

    if (!productType || !size) {
      return NextResponse.json({ error: 'Product type and size are required.' }, { status: 400 });
    }

    const normalizedType = productType as ProductType;
    const unitPriceCents = getProductPricing(normalizedType, size, 'US', frameUpgrade);
    const quantityInt = Math.max(1, Number(quantity) || 1);

    const result = await validateCouponAndCalculate(couponCode, unitPriceCents, quantityInt);

    return NextResponse.json({
      coupon: {
        id: result.coupon.id,
        code: normalizeCouponCode(result.coupon.code),
        description: result.coupon.description,
        discountType: result.coupon.discount_type,
        discountValue: result.coupon.discount_value,
        metadata: result.coupon.metadata
      },
      originalUnitPriceCents: unitPriceCents,
      finalUnitPriceCents: result.finalUnitPriceCents,
      discountPerUnitCents: result.discountPerUnitCents,
      totalDiscountCents: result.totalDiscountCents,
      quantity: quantityInt
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to validate coupon code.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
