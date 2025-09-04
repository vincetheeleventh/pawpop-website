// src/app/api/checkout/artwork/route.ts
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { ProductType, getProductPricing } from '@/lib/printify-products';
import { createOrder } from '@/lib/supabase-orders';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      artworkId, 
      productType, 
      size, 
      customerEmail, 
      customerName, 
      petName, 
      imageUrl,
      testMode = false
    } = body;

    // Test mode - return mock response without hitting Stripe/Printify
    if (testMode || !stripe) {
      console.log('🧪 TEST MODE: Checkout API called with:', {
        artworkId,
        productType,
        size,
        customerEmail,
        customerName,
        petName
      });

      // Simulate successful response
      return NextResponse.json({ 
        sessionId: `test_session_${Date.now()}`,
        testMode: true,
        message: 'Test mode - no actual payment processed',
        productDetails: {
          type: productType,
          size,
          estimatedPrice: getProductPricing(productType as ProductType, size, 'US')
        }
      });
    }

    // Validate required fields
    if (!artworkId || !productType || !size || !customerEmail || !customerName || !imageUrl) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Get pricing
    const priceInCents = getProductPricing(productType as ProductType, size, 'US');
    
    // Create order in database first
    const order = await createOrder({
      artwork_id: artworkId,
      stripe_session_id: '', // Will be updated after session creation
      product_type: productType as ProductType,
      product_size: size,
      price_cents: priceInCents,
      customer_email: customerEmail,
      customer_name: customerName
    });

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `PawPop ${productType === 'digital' ? 'Digital Download' : 
                   productType === 'art_print' ? 'Art Print' : 'Framed Canvas'} - ${size}`,
            description: `Custom artwork featuring ${customerName}${petName ? ` & ${petName}` : ''} in the style of the Mona Lisa`,
            images: [imageUrl]
          },
          unit_amount: priceInCents
        },
        quantity: 1
      }],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/artwork/${artworkId}?cancelled=true`,
      customer_email: customerEmail,
      metadata: {
        artworkId,
        productType,
        size,
        customerName,
        petName: petName || '',
        imageUrl,
        orderId: order.id
      },
      // Collect shipping address for physical products
      shipping_address_collection: productType !== 'digital' ? {
        allowed_countries: ['US', 'CA', 'GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'PT', 'IE']
      } : undefined
    });

    // Update order with session ID
    await stripe.checkout.sessions.update(session.id, {
      metadata: {
        ...session.metadata,
        stripe_session_id: session.id
      }
    });

    return NextResponse.json({ sessionId: session.id });

  } catch (error) {
    console.error('Checkout error:', error);
    return new NextResponse('Checkout failed', { status: 500 });
  }
}
