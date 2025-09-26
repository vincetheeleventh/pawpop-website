// src/lib/supabase-coupons.ts
import { supabaseAdmin, type CouponCode, type CouponDiscountType } from './supabase';

function ensureSupabaseAdmin() {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not available - missing SUPABASE_SERVICE_ROLE_KEY');
  }
  return supabaseAdmin;
}

const MINIMUM_PRICE_CENTS = 0;

export interface CouponCalculationResult {
  coupon: CouponCode;
  finalUnitPriceCents: number;
  discountPerUnitCents: number;
  totalDiscountCents: number;
  quantity: number;
}

export function normalizeCouponCode(code: string): string {
  return code.trim().toUpperCase();
}

export async function getCouponByCode(code: string): Promise<CouponCode | null> {
  const normalizedCode = normalizeCouponCode(code);

  const query = ensureSupabaseAdmin()
    .from('coupon_codes')
    .select('*')
    .eq('code', normalizedCode)
    .limit(1);

  const executor = (query as any).maybeSingle ? (query as any).maybeSingle.bind(query) : (query as any).single?.bind(query);
  const { data, error } = executor ? await executor() : await query.single();

  if (error) {
    if ((error as { code?: string }).code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching coupon code:', error);
    throw new Error(`Failed to validate coupon code: ${error.message}`);
  }

  return data ?? null;
}

export function getCouponIneligibilityReason(coupon: CouponCode): string | null {
  const now = new Date();

  if (!coupon.is_active) {
    return 'This coupon is no longer active.';
  }

  if (coupon.valid_from && new Date(coupon.valid_from) > now) {
    return 'This coupon is not active yet.';
  }

  if (coupon.valid_until && new Date(coupon.valid_until) < now) {
    return 'This coupon has expired.';
  }

  if (
    typeof coupon.max_redemptions === 'number' &&
    coupon.max_redemptions >= 0 &&
    coupon.redemption_count >= coupon.max_redemptions
  ) {
    return 'This coupon has already been fully redeemed.';
  }

  return null;
}

function calculateSetPrice(unitPriceCents: number, coupon: CouponCode): number {
  const targetPrice = Math.max(MINIMUM_PRICE_CENTS, coupon.discount_value);
  return Math.min(unitPriceCents, targetPrice);
}

function calculateAmountOff(unitPriceCents: number, coupon: CouponCode): number {
  const discounted = unitPriceCents - coupon.discount_value;
  return Math.max(MINIMUM_PRICE_CENTS, Math.min(unitPriceCents, discounted));
}

function calculatePercentOff(unitPriceCents: number, coupon: CouponCode): number {
  const percentage = Math.min(Math.max(coupon.discount_value, 0), 100);
  const discounted = Math.round(unitPriceCents * (1 - percentage / 100));
  return Math.max(MINIMUM_PRICE_CENTS, Math.min(unitPriceCents, discounted));
}

function calculateFinalUnitPrice(unitPriceCents: number, coupon: CouponCode): number {
  switch (coupon.discount_type as CouponDiscountType) {
    case 'set_price':
      return calculateSetPrice(unitPriceCents, coupon);
    case 'amount_off':
      return calculateAmountOff(unitPriceCents, coupon);
    case 'percent_off':
      return calculatePercentOff(unitPriceCents, coupon);
    default:
      return unitPriceCents;
  }
}

export function calculateCouponAdjustment(
  coupon: CouponCode,
  unitPriceCents: number,
  quantity: number = 1
): CouponCalculationResult {
  const normalizedQuantity = Math.max(1, quantity);
  const finalUnitPriceCents = calculateFinalUnitPrice(unitPriceCents, coupon);
  const discountPerUnitCents = Math.max(0, unitPriceCents - finalUnitPriceCents);
  const totalDiscountCents = discountPerUnitCents * normalizedQuantity;

  return {
    coupon,
    finalUnitPriceCents,
    discountPerUnitCents,
    totalDiscountCents,
    quantity: normalizedQuantity
  };
}

export async function validateCouponAndCalculate(
  code: string,
  unitPriceCents: number,
  quantity: number = 1
): Promise<CouponCalculationResult> {
  if (!code || !code.trim()) {
    throw new Error('Coupon code is required.');
  }

  if (unitPriceCents < 0) {
    throw new Error('Invalid base price for coupon calculation.');
  }

  const coupon = await getCouponByCode(code);

  if (!coupon) {
    throw new Error('Coupon code not found.');
  }

  const restriction = getCouponIneligibilityReason(coupon);
  if (restriction) {
    throw new Error(restriction);
  }

  return calculateCouponAdjustment(coupon, unitPriceCents, quantity);
}

export async function incrementCouponRedemption(couponId: string): Promise<void> {
  const { error } = await ensureSupabaseAdmin()
    .rpc('increment_coupon_redemption', { target_coupon_id: couponId });

  if (error) {
    console.error('Failed to increment coupon redemption count:', error);
  }
}
