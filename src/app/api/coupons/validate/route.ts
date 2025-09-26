import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export interface CouponValidationRequest {
  code: string;
  orderAmount: number;
  productType?: string;
}

export interface CouponValidationResponse {
  isValid: boolean;
  couponId?: string;
  discountType?: 'percentage' | 'fixed_amount';
  discountValue?: number;
  discountAmount?: number;
  finalAmount?: number;
  errorMessage?: string;
  savings?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: CouponValidationRequest = await request.json();
    const { code, orderAmount, productType } = body;

    // Validate input
    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Coupon code is required' },
        { status: 400 }
      );
    }

    if (!orderAmount || typeof orderAmount !== 'number' || orderAmount <= 0) {
      return NextResponse.json(
        { error: 'Valid order amount is required' },
        { status: 400 }
      );
    }

    // Check if Supabase is configured
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Coupon system not configured' },
        { status: 503 }
      );
    }

    // Create Supabase client at runtime
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Call the database function to validate coupon
    const { data, error } = await supabase.rpc('validate_coupon_code', {
      p_code: code.toUpperCase().trim(),
      p_order_amount: orderAmount,
      p_product_type: productType || null
    });

    if (error) {
      console.error('Error validating coupon:', error);
      return NextResponse.json(
        { error: 'Failed to validate coupon code' },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json({
        isValid: false,
        errorMessage: 'Invalid coupon code'
      } as CouponValidationResponse);
    }

    const result = data[0];
    
    const response: CouponValidationResponse = {
      isValid: result.is_valid,
      couponId: result.coupon_id,
      discountType: result.discount_type,
      discountValue: result.discount_value,
      discountAmount: result.discount_amount,
      finalAmount: result.final_amount,
      errorMessage: result.error_message,
      savings: result.is_valid ? (orderAmount - result.final_amount) : undefined
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in coupon validation API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint for testing
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const orderAmount = parseFloat(searchParams.get('orderAmount') || '29');
  
  if (!code) {
    return NextResponse.json(
      { error: 'Coupon code parameter is required' },
      { status: 400 }
    );
  }

  // Create a new request with the parsed parameters
  const mockRequest = {
    json: async () => ({ code, orderAmount })
  } as NextRequest;

  // Reuse POST logic
  return POST(mockRequest);
}
