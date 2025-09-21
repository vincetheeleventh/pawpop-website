// src/app/api/shipping/methods/route.ts
import { NextResponse } from 'next/server';
import { getAvailableShippingMethods } from '@/lib/order-processing';
import { ProductType } from '@/lib/printify';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productType = searchParams.get('productType') as ProductType;
    const countryCode = searchParams.get('countryCode') || 'US';

    if (!productType) {
      return new NextResponse('Product type is required', { status: 400 });
    }

    // Validate product type
    if (!Object.values(ProductType).includes(productType)) {
      return new NextResponse('Invalid product type', { status: 400 });
    }

    const shippingMethods = await getAvailableShippingMethods(productType, countryCode);

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
