// src/app/api/checkout/artwork/route.ts
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { ProductType, getProductPricing } from '@/lib/printify-products';
import { createOrder } from '@/lib/supabase-orders';

export async function POST(req: Request) {
  let requestData: any = {};

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
      frameUpgrade = false,
      quantity = 1,
      shippingMethodId,
      testMode = false
    } = body;

    // Store request data for error logging
    requestData = { artworkId, productType, size, customerEmail, customerName, petName };

    // Enhanced environment validation
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_API_KEY;
    const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

    console.log('🔍 Environment Check:', {
      hasStripeSecret: !!stripeSecretKey,
      hasStripePublishable: !!stripePublishableKey,
      hasBaseUrl: !!baseUrl,
      secretKeyType: stripeSecretKey ? (stripeSecretKey.startsWith('sk_live_') ? 'LIVE' : 'TEST') : 'MISSING',
      publishableKeyType: stripePublishableKey ? (stripePublishableKey.startsWith('pk_live_') ? 'LIVE' : 'TEST') : 'MISSING'
    });

    // Test mode - return mock response without hitting Stripe/Printify
    if (testMode) {
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
          estimatedPrice: getProductPricing(productType as ProductType, size, 'US', frameUpgrade),
          frameUpgrade
        }
      });
    }

    // Enhanced Stripe configuration validation
    if (!stripe) {
      const errorDetails = {
        hasStripeSecret: !!stripeSecretKey,
        hasStripePublishable: !!stripePublishableKey,
        secretKeyPrefix: stripeSecretKey?.substring(0, 8) || 'missing',
        publishableKeyPrefix: stripePublishableKey?.substring(0, 8) || 'missing'
      };
      
      console.error('❌ Stripe Configuration Error:', errorDetails);
      
      return new NextResponse(
        JSON.stringify({
          error: 'Payment system not configured',
          details: 'Stripe keys are missing or invalid',
          debug: errorDetails
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate key matching (both should be live or both test)
    if (stripeSecretKey && stripePublishableKey) {
      const secretIsLive = stripeSecretKey.startsWith('sk_live_');
      const publishableIsLive = stripePublishableKey.startsWith('pk_live_');
      
      if (secretIsLive !== publishableIsLive) {
        console.error('❌ Stripe Key Mismatch:', {
          secretType: secretIsLive ? 'LIVE' : 'TEST',
          publishableType: publishableIsLive ? 'LIVE' : 'TEST'
        });
        
        return new NextResponse(
          JSON.stringify({
            error: 'Payment system configuration error',
            details: 'Stripe key environment mismatch'
          }),
          { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    }

    // Validate required fields
    if (!artworkId || !productType || !size || !customerEmail || !customerName || !imageUrl) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    console.log('🔍 Checkout API Debug:', {
      productType,
      size,
      frameUpgrade,
      quantity,
      shippingMethodId
    });

    // Get pricing (including frame upgrade if applicable)
    const priceInCents = getProductPricing(productType as ProductType, size, 'US', frameUpgrade);
    console.log('💰 Calculated price:', priceInCents);

    // Check Stripe configuration
    if (!stripe) {
      throw new Error('Stripe is not configured - missing STRIPE_SECRET_KEY');
    }
    // Create Stripe checkout session
    console.log('💳 Creating Stripe checkout session...');
    console.log('🔑 Using Stripe key type:', process.env.STRIPE_SECRET_KEY?.substring(0, 10) + '...');
    
    // Validate image URL (Stripe images must be valid URLs; otherwise omit)
    const isValidImage = (() => {
      try {
        const u = new URL(imageUrl);
        return u.protocol === 'http:' || u.protocol === 'https:';
      } catch {
        return false;
      }
    })();

    // Build minimal product data to avoid base64 encoding issues
    const productData: any = {
      name: `PawPop ${productType === 'digital' ? 'Digital Download' : 
             productType === 'art_print' ? 'Art Print' :
             productType === 'canvas_stretched' ? 'Canvas (Stretched)' :
             'Canvas (Framed)'} - ${size}`,
      description: `Custom pet portrait in Mona Lisa style`,
    };
    
    // Skip images for now to avoid potential base64 encoding issues
    // if (isValidImage) {
    //   productData.images = [imageUrl];
    // }

    let session;
    try {
      session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'cad',
            product_data: productData,
            unit_amount: priceInCents
          },
          quantity: quantity
        }],
        mode: 'payment',
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/artwork/${artworkId}?cancelled=true`,
        automatic_tax: {
          enabled: false,
        },
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
        customer_email: customerEmail,
        metadata: {
          artworkId,
          productType,
          size,
          customerName: customerName.substring(0, 50), // Limit length
          petName: (petName || '').substring(0, 50), // Limit length
          frameUpgrade: frameUpgrade.toString(),
          quantity: quantity.toString()
        },
        // Collect shipping address for physical products
        shipping_address_collection: productType !== 'digital' ? {
          allowed_countries: ['US', 'CA', 'GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'PT', 'IE', 'FI', 'SE', 'DK', 'NO', 'PL', 'CZ', 'HU', 'SK', 'SI', 'HR', 'BG', 'RO', 'LT', 'LV', 'EE', 'MT', 'CY', 'LU', 'GR']
        } : undefined
      });
      console.log('✅ Stripe session created:', session.id);

    } catch (stripeError) {
      console.error('❌ Stripe error:', stripeError);
      throw new Error(`Stripe session creation failed: ${stripeError instanceof Error ? stripeError.message : 'Unknown Stripe error'}`);
    }

    // Create order in database with the actual session ID
    console.log('📝 Creating order in database...');
    let order;
    try {
      order = await createOrder({
        artwork_id: artworkId,
        stripe_session_id: session.id, // Use the actual session ID
        product_type: productType as ProductType,
        product_size: size,
        price_cents: priceInCents,
        customer_email: customerEmail,
        customer_name: customerName
      });
      console.log('✅ Order created:', order.id);
    } catch (dbError) {
      console.error('❌ Database error creating order:', dbError);
      // Continue with checkout even if DB fails - order will be created via webhook
      console.log('⚠️ Continuing with checkout - order will be created via webhook');
    }

    return NextResponse.json({ sessionId: session.id });

  } catch (error) {
    console.error('Checkout error details:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      requestData
    });

    // Return more specific error information with debugging context
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    // Check if it's a Stripe-specific error
    if (errorMessage.includes('No such price') || errorMessage.includes('Invalid API key')) {
      return new NextResponse(
        JSON.stringify({
          error: 'Payment configuration error',
          details: 'Please check your Stripe configuration',
          message: errorMessage
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return new NextResponse(
      JSON.stringify({
        error: 'Checkout failed',
        details: errorMessage,
        requestData: {
          artworkId: requestData.artworkId,
          productType: requestData.productType,
          size: requestData.size
        }
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
