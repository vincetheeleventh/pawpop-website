import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST, GET } from '@/app/api/coupons/validate/route';
import { NextRequest } from 'next/server';

// Mock Supabase
const mockSupabaseRpc = vi.fn();
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    rpc: mockSupabaseRpc
  }))
}));

describe('/api/coupons/validate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/coupons/validate', () => {
    it('should validate a valid coupon code', async () => {
      const mockCouponData = [{
        is_valid: true,
        coupon_id: 'coupon-123',
        discount_type: 'percentage',
        discount_value: 99.00,
        discount_amount: 28.71,
        final_amount: 1.00,
        error_message: null
      }];

      mockSupabaseRpc.mockResolvedValue({
        data: mockCouponData,
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({
          code: 'TEST99',
          orderAmount: 29.00,
          productType: 'art_print'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.isValid).toBe(true);
      expect(data.couponId).toBe('coupon-123');
      expect(data.discountType).toBe('percentage');
      expect(data.discountValue).toBe(99.00);
      expect(data.discountAmount).toBe(28.71);
      expect(data.finalAmount).toBe(1.00);
      expect(data.savings).toBe(28.00);
      expect(data.errorMessage).toBeUndefined();
    });

    it('should handle invalid coupon code', async () => {
      const mockCouponData = [{
        is_valid: false,
        coupon_id: null,
        discount_type: null,
        discount_value: null,
        discount_amount: null,
        final_amount: 29.00,
        error_message: 'Invalid coupon code'
      }];

      mockSupabaseRpc.mockResolvedValue({
        data: mockCouponData,
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({
          code: 'INVALID',
          orderAmount: 29.00
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.isValid).toBe(false);
      expect(data.errorMessage).toBe('Invalid coupon code');
    });

    it('should handle expired coupon', async () => {
      const mockCouponData = [{
        is_valid: false,
        coupon_id: 'coupon-123',
        discount_type: 'percentage',
        discount_value: 10.00,
        discount_amount: null,
        final_amount: 29.00,
        error_message: 'Coupon has expired'
      }];

      mockSupabaseRpc.mockResolvedValue({
        data: mockCouponData,
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({
          code: 'EXPIRED10',
          orderAmount: 29.00
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.isValid).toBe(false);
      expect(data.errorMessage).toBe('Coupon has expired');
    });

    it('should validate fixed amount coupon', async () => {
      const mockCouponData = [{
        is_valid: true,
        coupon_id: 'coupon-456',
        discount_type: 'fixed_amount',
        discount_value: 28.00,
        discount_amount: 28.00,
        final_amount: 1.00,
        error_message: null
      }];

      mockSupabaseRpc.mockResolvedValue({
        data: mockCouponData,
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({
          code: 'DOLLAR1',
          orderAmount: 29.00
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.isValid).toBe(true);
      expect(data.discountType).toBe('fixed_amount');
      expect(data.discountValue).toBe(28.00);
      expect(data.discountAmount).toBe(28.00);
      expect(data.finalAmount).toBe(1.00);
    });

    it('should handle minimum order amount not met', async () => {
      const mockCouponData = [{
        is_valid: false,
        coupon_id: 'coupon-789',
        discount_type: 'percentage',
        discount_value: 10.00,
        discount_amount: null,
        final_amount: 15.00,
        error_message: 'Order amount does not meet minimum requirement of $50.00'
      }];

      mockSupabaseRpc.mockResolvedValue({
        data: mockCouponData,
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({
          code: 'BIGORDER10',
          orderAmount: 15.00
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.isValid).toBe(false);
      expect(data.errorMessage).toBe('Order amount does not meet minimum requirement of $50.00');
    });

    it('should handle missing coupon code', async () => {
      const request = new NextRequest('http://localhost:3000/api/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({
          orderAmount: 29.00
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Coupon code is required');
    });

    it('should handle missing order amount', async () => {
      const request = new NextRequest('http://localhost:3000/api/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({
          code: 'TEST99'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Valid order amount is required');
    });

    it('should handle database error', async () => {
      mockSupabaseRpc.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' }
      });

      const request = new NextRequest('http://localhost:3000/api/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({
          code: 'TEST99',
          orderAmount: 29.00
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to validate coupon code');
    });

    it('should handle empty database response', async () => {
      mockSupabaseRpc.mockResolvedValue({
        data: [],
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({
          code: 'NOTFOUND',
          orderAmount: 29.00
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.isValid).toBe(false);
      expect(data.errorMessage).toBe('Invalid coupon code');
    });
  });

  describe('GET /api/coupons/validate', () => {
    it('should validate coupon via GET request', async () => {
      const mockCouponData = [{
        is_valid: true,
        coupon_id: 'coupon-123',
        discount_type: 'percentage',
        discount_value: 10.00,
        discount_amount: 2.90,
        final_amount: 26.10,
        error_message: null
      }];

      mockSupabaseRpc.mockResolvedValue({
        data: mockCouponData,
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/coupons/validate?code=WELCOME10&orderAmount=29.00');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.isValid).toBe(true);
      expect(data.discountAmount).toBe(2.90);
      expect(data.finalAmount).toBe(26.10);
    });

    it('should handle missing code parameter in GET', async () => {
      const request = new NextRequest('http://localhost:3000/api/coupons/validate?orderAmount=29.00');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Coupon code parameter is required');
    });

    it('should use default order amount in GET', async () => {
      const mockCouponData = [{
        is_valid: true,
        coupon_id: 'coupon-123',
        discount_type: 'percentage',
        discount_value: 10.00,
        discount_amount: 2.90,
        final_amount: 26.10,
        error_message: null
      }];

      mockSupabaseRpc.mockResolvedValue({
        data: mockCouponData,
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/coupons/validate?code=WELCOME10');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockSupabaseRpc).toHaveBeenCalledWith('validate_coupon_code', {
        p_code: 'WELCOME10',
        p_order_amount: 29,
        p_product_type: null
      });
    });
  });
});
