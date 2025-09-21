// src/app/api/test/printify-mockup/route.ts
import { NextResponse } from 'next/server';
import { getOrCreatePrintifyProduct } from '@/lib/printify-products';
import { ProductType } from '@/lib/printify-products';

export async function POST(req: Request) {
  try {
    // Check environment variables first
    if (!process.env.PRINTIFY_API_TOKEN) {
      console.error('❌ PRINTIFY_API_TOKEN is not set');
      return NextResponse.json({ error: 'PRINTIFY_API_TOKEN is not configured' }, { status: 500 });
    }

    if (!process.env.PRINTIFY_SHOP_ID) {
      console.error('❌ PRINTIFY_SHOP_ID is not set');
      return NextResponse.json({ error: 'PRINTIFY_SHOP_ID is not configured' }, { status: 500 });
    }

    console.log('✅ Environment variables check passed');
    console.log('PRINTIFY_SHOP_ID:', process.env.PRINTIFY_SHOP_ID);

    const body = await req.json();
    const { 
      imageUrl, 
      productType = 'art_print', 
      size = '16x24',
      customerName = 'Test Customer'
    } = body;

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
    }

    console.log('🖼️ Creating Printify product mockup...', {
      imageUrl,
      productType,
      size,
      customerName
    });

    console.log('📝 About to call getOrCreatePrintifyProduct with:', {
      productType: productType as ProductType,
      size,
      imageUrl,
      region: 'US',
      customerName,
      petName: 'Test Pet'
    });

    // Create actual Printify product to get mockup
    const printifyProduct = await getOrCreatePrintifyProduct(
      productType as ProductType,
      size,
      imageUrl,
      'US', // Default to US region
      customerName,
      'Test Pet'
    );

    console.log('✅ Printify product created:', printifyProduct);

    // Fetch product details including mockup images
    const printifyApiUrl = `https://api.printify.com/v1/shops/${process.env.PRINTIFY_SHOP_ID}/products/${printifyProduct.productId}.json`;
    
    const response = await fetch(printifyApiUrl, {
      headers: {
        'Authorization': `Bearer ${process.env.PRINTIFY_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Printify API error: ${response.status}`);
    }

    const productDetails = await response.json();
    
    // Extract mockup images
    const mockups = productDetails.images || [];
    const variants = productDetails.variants || [];
    
    // Find the specific variant for the requested size
    const selectedVariant = variants.find((v: any) => 
      v.title?.toLowerCase().includes(size.toLowerCase())
    ) || variants[0];

    return NextResponse.json({
      success: true,
      printifyProductId: printifyProduct.productId,
      productDetails: {
        title: productDetails.title,
        description: productDetails.description,
        tags: productDetails.tags
      },
      mockups: mockups.map((img: any) => ({
        src: img.src,
        variant_ids: img.variant_ids,
        position: img.position,
        is_default: img.is_default
      })),
      selectedVariant: selectedVariant ? {
        id: selectedVariant.id,
        title: selectedVariant.title,
        price: selectedVariant.price,
        is_enabled: selectedVariant.is_enabled
      } : null,
      imageUrl,
      size,
      productType,
      message: 'Printify product created successfully with mockups'
    });

  } catch (error) {
    console.error('Printify mockup creation error:', error);
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to create Printify mockup',
      details: 'Check server logs for more information'
    }, { status: 500 });
  }
}
