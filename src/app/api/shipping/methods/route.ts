// src/app/api/shipping/methods/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAvailableShippingMethods } from '@/lib/order-processing';

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const productType = searchParams.get('productType');
    const countryCode = searchParams.get('countryCode') || 'US';

    if (!productType) {
      return new NextResponse('Product type is required', { status: 400 });
    }

    // Validate product type
    const validProductTypes = ['digital', 'art_print', 'canvas_stretched', 'canvas_framed'];
    if (!validProductTypes.includes(productType)) {
      return new NextResponse('Invalid product type', { status: 400 });
    }

    const shippingMethods = await getAvailableShippingMethods(productType as any, countryCode);

    return NextResponse.json({ 
      success: true,
      shippingMethods,
      countryCode,
      productType
    });

  } catch (error) {
    console.error('Shipping methods API error:', error);
    return new NextResponse('Failed to fetch shipping methods', { status: 500 });
  }
}
